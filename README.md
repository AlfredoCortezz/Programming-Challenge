# Programming-Challenge
📊 Análisis al Instante - Dashboard con IA
🔗 Enlaces
Repositorio: github.com/AlfredoCortezz/Programming-Challenge

Demo: alfredocortezz-programming-challenge.streamlit.app

🚀 Características
Sube archivos CSV o Excel

Análisis automático con IA (OpenAI)

Sugerencias de visualizaciones

Dashboard interactivo con Plotly

🛠 Decisiones Técnicas

Frontend & UI
Streamlit: Elegido por su rápida implementación para aplicaciones de datos

Plotly: Gráficos interactivos profesionales vs alternativas estáticas

CSS Custom: Mejoras de UX sobre el tema por defecto de Streamlit

Backend & Procesamiento
Python 3.8+: Ecosistema maduro de data science

Pandas: Estándar industry para manipulación de datos

OpenAI GPT-4: Mejor comprensión contextual vs modelos anteriores

OpenPyXL: Soporte nativo para Excel sin dependencias externas

Arquitectura
Monolítica: Simplicidad y velocidad de desarrollo

Procesamiento Síncrono: Respuesta inmediata al usuario

Separación de Capas:

UI (Streamlit)

Lógica de Negocio (Python)

IA (OpenAI API)

Despliegue
Streamlit Cloud: Cero configuración vs otras plataformas

Environment Variables: Seguridad de API keys

Requirements.txt: Control preciso de versiones


⚡ Instalación Local
Clonar y entrar en la carpeta:

bash
git clone https://github.com/AlfredoCortezz/Programming-Challenge.git
cd Programming-Challenge/backend
Entorno virtual y dependencias:

bash
python -m venv venv
source venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
Configurar API key de OpenAI:

bash
echo "OPENAI_API_KEY=tu_api_key" > .env
Ejecutar:

bash
streamlit run app.py

🤖 Prompt Engineering

"Rol: Analista de datos senior
Entrada: Esquema de datos (columnas, tipos, estadísticas)
Tarea: Sugerir 3-5 visualizaciones óptimas
Formato Salida: JSON estructurado"

Prompt estructurado para análisis de datos

Respuesta en JSON con sugerencias de gráficos

Validación y manejo de errores

🎯 Uso

Subir archivo

Revisar vista previa y estadísticas

Obtener sugerencias de IA

Visualizar en dashboard

