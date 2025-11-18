from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import chardet
import uuid
from io import BytesIO
import logging
import json
import openai
import os
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")

analysis_cache = {}

@app.get("/")
async def root():
    return {"status": "online", "message": "AI Dashboard Creator API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        ext = file.filename.lower()

        if not ext.endswith((".csv", ".xlsx", ".xls")):
            raise HTTPException(400, "Solo se permiten archivos CSV o Excel")

        content = await file.read()
        session_id = str(uuid.uuid4())

        # CSV
        if ext.endswith(".csv"):
            enc = chardet.detect(content)["encoding"] or "utf-8"
            df = pd.read_csv(BytesIO(content), encoding=enc)

        # Excel
        else:
            df = pd.read_excel(BytesIO(content))

        df = df.dropna(how="all").reset_index(drop=True)

        # Análisis rápido
        quick = {
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB",
            "missing_values": df.isnull().sum().to_dict()
        }

        # Guardar en caché
        analysis_cache[session_id] = {
            "quick_analysis": quick,
            "data_preview": df.head(10).to_dict('records'),
            "status": "completed"
        }

        # Iniciar análisis IA en background
        asyncio.create_task(generate_ai_analysis(df, session_id))

        return JSONResponse({
            "session_id": session_id, 
            "quick_analysis": quick,
            "message": "Archivo procesado exitosamente. Análisis IA en progreso...",
            "status": "processing"
        })

    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(500, f"Error procesando archivo: {str(e)}")

async def generate_ai_analysis(df: pd.DataFrame, session_id: str):
    """Generar análisis de IA en background"""
    try:
        # Preparar datos para IA
        summary = {
            "columns": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "shape": df.shape,
            "sample": df.head(3).to_dict('records')
        }
        
        prompt = f"""
        Eres un analista de datos experto. Analiza este dataset y sugiere visualizaciones útiles.
        
        INFORMACIÓN DEL DATASET:
        - Columnas: {summary['columns']}
        - Tipos de datos: {summary['dtypes']}
        - Forma: {summary['shape']}
        - Muestra: {summary['sample']}
        
        RESPUESTA EN FORMATO JSON EXACTO:
        {{
            "visualizations": [
                {{
                    "id": "1",
                    "title": "Título descriptivo",
                    "chart_type": "bar",
                    "insight": "Análisis breve",
                    "parameters": {{
                        "x_axis": "columna_x",
                        "y_axis": "columna_y"
                    }}
                }}
            ]
        }}
        
        Sugiere 3-5 visualizaciones basadas en los datos.
        """
        
        if openai.api_key:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            
            ai_result = json.loads(response.choices[0].message.content)
            
            # Actualizar caché con resultados de IA
            if session_id in analysis_cache:
                analysis_cache[session_id].update({
                    "visualizations": ai_result.get("visualizations", []),
                    "status": "completed"
                })
        else:
            # Fallback si no hay API key
            fallback_viz = [
                {
                    "id": "1",
                    "title": f"Distribución de {df.columns[0]}",
                    "chart_type": "bar",
                    "insight": "Visualización básica de la primera columna",
                    "parameters": {"x_axis": df.columns[0], "y_axis": "count"}
                }
            ]
            
            if session_id in analysis_cache:
                analysis_cache[session_id].update({
                    "visualizations": fallback_viz,
                    "status": "completed"
                })
                
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        if session_id in analysis_cache:
            analysis_cache[session_id].update({
                "status": "error",
                "error": str(e)
            })

@app.get("/analysis/{session_id}")
async def get_analysis(session_id: str):
    """Obtener análisis completo incluyendo IA"""
    if session_id not in analysis_cache:
        raise HTTPException(404, "Sesión no encontrada")
    
    analysis = analysis_cache[session_id]
    
    if analysis["status"] == "processing":
        return JSONResponse({
            "status": "processing",
            "message": "El análisis aún está en progreso..."
        })
    elif analysis["status"] == "error":
        raise HTTPException(500, f"Error en análisis: {analysis.get('error')}")
    
    return JSONResponse(analysis)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)