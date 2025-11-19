📊 Análisis al Instante - Dashboard con IA

🚀 Características
Sube archivos CSV o Excel

Análisis automático con IA (OpenAI)

Sugerencias inteligentes de visualizaciones

Dashboard interactivo con Plotly

Procesamiento en tiempo real

🛠 Decisiones Técnicas
Frontend & UI
Streamlit como framework principal para desarrollo rápido de aplicaciones de datos, Plotly para gráficos interactivos profesionales, y CSS personalizado para mejoras de experiencia de usuario.

Backend & Procesamiento
Python 3.8+ con su ecosistema robusto para ciencia de datos, Pandas como estándar industrial para análisis de datos, OpenAI GPT-4 para análisis inteligente contextual, y OpenPyXL para soporte nativo de Excel.

Arquitectura
Arquitectura monolítica optimizada para simplicidad y velocidad, procesamiento síncrono para respuesta inmediata, y separación clara entre capas de presentación, lógica de negocio e inteligencia artificial.

## ⚡ Instalación Local

### Backend

Clonar el repositorio y acceder a la carpeta backend:

git clone https://github.com/AlfredoCortezz/Programming-Challenge.git
cd Programming-Challenge/backend

Crear y activar entorno virtual:

python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

Instalar dependencias:

pip install -r requirements.txt

Configurar API key de OpenAI:

echo "OPENAI_API_KEY=tu_clave_api_aqui" > .env

Ejecutar la aplicación:

python app.py  # o como se llame tu archivo principal

### Frontend

Acceder a la carpeta frontend:

cd ../frontend

Instalar dependencias:

npm install

Ejecutar la aplicación:

npm start

Acceder en el navegador: http://localhost:3000

🤖 Ingeniería de Prompts
Sistema: "Eres un analista de datos senior con expertise en visualización"
Entrada: "Esquema de datos: columnas, tipos de datos, estadísticas descriptivas"
Tarea: "Identificar 3-5 visualizaciones óptimas para los datos proporcionados"
Formato: "JSON estructurado con título, tipo de gráfico, parámetros e insight"

Técnicas implementadas: contextualización específica del rol, estructura de salida estricta en JSON, validación multi-nivel, y manejo robusto de errores con fallbacks.

🎯 Flujo de Uso
Subir archivo CSV o Excel mediante interfaz drag-and-drop

Revisar vista previa de datos y estadísticas básicas

Ejecutar análisis con IA para obtener sugerencias de visualizaciones

Explorar dashboard interactivo con gráficos propuestos

