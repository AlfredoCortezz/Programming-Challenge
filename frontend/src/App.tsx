import React, { useState, useRef } from "react";

// Estilos
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))'
  },
  card: {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    padding: '32px',
    position: 'relative' as const,
    margin: '20px auto',
    maxWidth: '800px'
  },
  button: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  uploadArea: {
    border: '2px dashed #475569',
    borderRadius: '12px',
    padding: '48px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  metricCard: {
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    textAlign: 'center' as const
  }
};

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [quick, setQuick] = useState<any>(null);
  const [visualizations, setVisualizations] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URLs sin API//
  const API_BASE = "http://localhost:8000";

  const handleUpload = async () => {
    if (!selectedFile) return alert("Selecciona un archivo");

    setLoading(true);
    setVisualizations([]);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // URL correcta sin /api
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setQuick(data.quick_analysis);

      // Polling para obtener análisis IA
      pollForAnalysis(data.session_id);

    } catch (err: any) {
      alert("Error al subir archivo: " + err.message);
      setLoading(false);
    }
  };

  const pollForAnalysis = async (sessionId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      try {
        //  URL correcta sin /api
        const response = await fetch(`${API_BASE}/analysis/${sessionId}`);
        
        if (!response.ok) {
          throw new Error(`Analysis failed (${response.status})`);
        }

        const data = await response.json();
        
        if (data.status === "completed") {
          setVisualizations(data.visualizations || []);
          setLoading(false);
        } else if (data.status === "error") {
          throw new Error(data.error || "Error en análisis IA");
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000);
          } else {
            throw new Error("Tiempo de análisis excedido");
          }
        }
      } catch (error: any) {
        console.error("Error en polling:", error);
        setLoading(false);
        // No mostrar alerta para evitar spam
      }
    };

    poll();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.includes('.csv')) return '📊';
    if (fileName.includes('.xlsx')) return '📈';
    if (fileName.includes('.xls')) return '📉';
    return '📁';
  };

  const getDataTypeDistribution = () => {
    if (!quick?.dtypes) return [];
    
    const typeCount: { [key: string]: number } = {};
    
    Object.values(quick.dtypes).forEach((type: any) => {
      const cleanType = type.includes('int') ? 'integer' : 
                       type.includes('float') ? 'float' : 
                       type.includes('object') ? 'text' : 
                       type.includes('datetime') ? 'date' : type;
      typeCount[cleanType] = (typeCount[cleanType] || 0) + 1;
    });

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
    
    return Object.entries(typeCount).map(([name, value], index) => ({
      name,
      value,
      percentage: Math.round((value / Object.keys(quick.dtypes).length) * 100),
      color: colors[index % colors.length]
    }));
  };

  const dataTypeDistribution = getDataTypeDistribution();

  const PieChart = ({ data, size = 200 }: { data: any[], size?: number }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = size / 2;
    let currentAngle = 0;

    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const largeArc = angle > 180 ? 1 : 0;
            
            const x1 = radius + radius * Math.cos(currentAngle * Math.PI / 180);
            const y1 = radius + radius * Math.sin(currentAngle * Math.PI / 180);
            const x2 = radius + radius * Math.cos((currentAngle + angle) * Math.PI / 180);
            const y2 = radius + radius * Math.sin((currentAngle + angle) * Math.PI / 180);

            const pathData = [
              `M ${radius} ${radius}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            const sliceAngle = currentAngle + (angle / 2);
            const labelRadius = radius * 0.7;
            const labelX = radius + labelRadius * Math.cos(sliceAngle * Math.PI / 180);
            const labelY = radius + labelRadius * Math.sin(sliceAngle * Math.PI / 180);

            currentAngle += angle;

            return (
              <g key={index}>
                <path d={pathData} fill={item.color} stroke="#0f172a" strokeWidth="2" />
                {percentage > 10 && (
                  <text 
                    x={labelX} 
                    y={labelY} 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {item.percentage}%
                  </text>
                )}
              </g>
            );
          })}
          <circle cx={radius} cy={radius} r={radius * 0.3} fill="#1e293b" />
          <text 
            x={radius} 
            y={radius} 
            textAnchor="middle" 
            dominantBaseline="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
          >
            Tipos
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '48px 20px', textAlign: 'center'}}>
          <div style={{marginBottom: '24px'}}>
            <span style={{fontSize: '48px'}}>🚀</span>
          </div>
          <h1 style={{fontSize: '48px', fontWeight: 'bold', marginBottom: '16px', background: 'linear-gradient(135deg, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            AI Dashboard Creator
          </h1>
          <p style={{fontSize: '20px', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto'}}>
            Transforma tus datos en insights poderosos con inteligencia artificial
          </p>
        </div>
      </header>

      <main style={{maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
        {/*Card */}
        <div style={styles.card}>
          {!selectedFile ? (
            <div
              style={{
                ...styles.uploadArea,
                borderColor: dragActive ? '#3b82f6' : '#475569',
                background: dragActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div style={{maxWidth: '400px', margin: '0 auto'}}>
                <div style={{marginBottom: '24px'}}>
                  <span style={{fontSize: '48px'}}>📁</span>
                </div>
                
                <h3 style={{fontSize: '24px', fontWeight: '600', color: 'white', marginBottom: '8px'}}>
                  {dragActive ? "¡Suelta tu archivo!" : "Arrastra tu archivo aquí"}
                </h3>
                
                <p style={{color: '#94a3b8', marginBottom: '24px'}}>
                  o haz clic para seleccionar desde tu computadora
                </p>

                <div style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>
                  <div style={{display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '8px'}}>
                    <span>📊 CSV</span>
                    <span>📈 Excel</span>
                  </div>
                  <p>Máximo 10MB</p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.button}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Seleccionar Archivo
                </button>
              </div>
            </div>
          ) : (
            <div style={{textAlign: 'center' as const}}>
              <div style={{marginBottom: '24px'}}>
                <span style={{fontSize: '48px'}}>{getFileIcon(selectedFile.name)}</span>
              </div>

              <div style={{
                background: 'rgba(51, 65, 85, 0.5)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid rgba(100, 116, 139, 0.5)'
              }}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <span style={{fontSize: '24px'}}>{getFileIcon(selectedFile.name)}</span>
                    <div style={{textAlign: 'left'}}>
                      <h4 style={{color: 'white', fontWeight: '600', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {selectedFile.name}
                      </h4>
                      <p style={{color: '#94a3b8', fontSize: '14px'}}>
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    style={{color: '#94a3b8', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer'}}
                    onMouseOver={(e) => e.currentTarget.style.color = '#f87171'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={loading}
                style={{
                  ...styles.button,
                  background: loading ? '#4b5563' : 'linear-gradient(135deg, #10b981, #059669)',
                  width: '100%',
                  padding: '16px',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {loading ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Procesando con IA...</span>
                  </div>
                ) : (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
                    <span>🚀</span>
                    <span>Analizar con Inteligencia Artificial</span>
                  </div>
                )}
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
            style={{display: 'none'}}
          />
        </div>

        {/* Quick Analysis Results */}
        {quick && (
          <div style={{marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
            {/* Row Count Card */}
            <div style={styles.metricCard}>
              <div style={{marginBottom: '16px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '8px', display: 'inline-block'}}>
                <span style={{fontSize: '20px'}}>📊</span>
              </div>
              <h3 style={{fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px'}}>
                {quick.rows?.toLocaleString()}
              </h3>
              <p style={{color: '#94a3b8', fontSize: '14px'}}>Total de Filas</p>
            </div>

            {/* Column Count Card */}
            <div style={styles.metricCard}>
              <div style={{marginBottom: '16px', background: 'rgba(168, 85, 247, 0.2)', borderRadius: '8px', padding: '8px', display: 'inline-block'}}>
                <span style={{fontSize: '20px'}}>📋</span>
              </div>
              <h3 style={{fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px'}}>
                {quick.columns}
              </h3>
              <p style={{color: '#94a3b8', fontSize: '14px'}}>Total de Columnas</p>
            </div>

            {/* Memory Usage Card */}
            <div style={styles.metricCard}>
              <div style={{marginBottom: '16px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '8px', display: 'inline-block'}}>
                <span style={{fontSize: '20px'}}>💾</span>
              </div>
              <h3 style={{fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px'}}>
                {quick.memory_usage}
              </h3>
              <p style={{color: '#94a3b8', fontSize: '14px'}}>Uso de Memoria</p>
            </div>

            {/* Data Types Card */}
            <div style={styles.metricCard}>
              <div style={{marginBottom: '16px', background: 'rgba(249, 115, 22, 0.2)', borderRadius: '8px', padding: '8px', display: 'inline-block'}}>
                <span style={{fontSize: '20px'}}>🔧</span>
              </div>
              <h3 style={{fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px'}}>
                {Object.keys(quick.dtypes || {}).length}
              </h3>
              <p style={{color: '#94a3b8', fontSize: '14px'}}>Tipos de Datos</p>
            </div>
          </div>
        )}

        {/* Visualizaciones de IA */}
        {visualizations.length > 0 && (
          <div style={{...styles.card, marginTop: '32px'}}>
            <h3 style={{fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px', textAlign: 'center'}}>
              🤖 Visualizaciones Sugeridas por IA
            </h3>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
              {visualizations.map((viz, index) => (
                <div key={index} style={{
                  background: 'rgba(51, 65, 85, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(71, 85, 105, 0.5)'
                }}>
                  <h4 style={{color: 'white', marginBottom: '10px'}}>{viz.title}</h4>
                  <p style={{color: '#94a3b8', fontSize: '14px', marginBottom: '15px'}}>{viz.insight}</p>
                  <div style={{color: '#cbd5e1', fontSize: '12px'}}>
                    Tipo: {viz.chart_type} | X: {viz.parameters?.x_axis} | Y: {viz.parameters?.y_axis}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Type Distribution Pie Chart */}
        {dataTypeDistribution.length > 0 && (
          <div style={{...styles.card, marginTop: '32px'}}>
            <h3 style={{fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px', textAlign: 'center'}}>
              📈 Distribución de Tipos de Datos
            </h3>
            
            <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '40px'}}>
              {/* Gráfico de Pastel */}
              <div style={{flex: '0 0 auto'}}>
                <PieChart data={dataTypeDistribution} size={220} />
              </div>
              
              {/* Gráfico */}
              <div style={{flex: '1', minWidth: '250px'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {dataTypeDistribution.map((item, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'rgba(51, 65, 85, 0.3)',
                        borderRadius: '8px',
                        border: '1px solid rgba(71, 85, 105, 0.5)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(51, 65, 85, 0.6)';
                        e.currentTarget.style.transform = 'translateX(8px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(51, 65, 85, 0.3)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div 
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            background: item.color
                          }}
                        />
                        <span style={{color: 'white', fontWeight: '500'}}>
                          {item.name}
                        </span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{color: '#94a3b8', fontSize: '14px'}}>
                          {item.value} columna{item.value > 1 ? 's' : ''}
                        </span>
                        <span style={{
                          color: item.color,
                          fontWeight: 'bold',
                          fontSize: '14px',
                          background: 'rgba(255,255,255,0.1)',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Estadísticas adicionales */}
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{color: '#cbd5e1', fontSize: '14px'}}>Total de columnas analizadas:</span>
                    <span style={{color: 'white', fontWeight: 'bold'}}>
                      {Object.keys(quick.dtypes || {}).length}
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px'}}>
                    <span style={{color: '#cbd5e1', fontSize: '14px'}}>Tipos únicos encontrados:</span>
                    <span style={{color: 'white', fontWeight: 'bold'}}>
                      {dataTypeDistribution.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Column Details */}
        {quick?.column_names && (
          <div style={{...styles.card, marginTop: '32px'}}>
            <h3 style={{fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center'}}>
              <span style={{background: 'rgba(99, 102, 241, 0.2)', borderRadius: '8px', padding: '8px', marginRight: '12px'}}>📑</span>
              Estructura del Dataset
            </h3>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px'}}>
              {quick.column_names.map((column: string, index: number) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(51, 65, 85, 0.3)',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid rgba(71, 85, 105, 0.5)',
                    transition: 'border-color 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#475569';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.5)';
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span style={{color: 'white', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {column}
                    </span>
                    <span style={{fontSize: '12px', background: '#475569', color: '#cbd5e1', padding: '4px 8px', borderRadius: '4px'}}>
                      {quick.dtypes?.[column] || 'object'}
                    </span>
                  </div>
                  <div style={{color: '#94a3b8', fontSize: '12px'}}>
                    Columna {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{borderTop: '1px solid #1e293b', marginTop: '64px'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '32px 20px'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: '16px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <div style={{background: '#1e293b', borderRadius: '8px', padding: '8px'}}>
                <span style={{fontSize: '20px'}}>🚀</span>
              </div>
              <div>
                <p style={{color: 'white', fontWeight: '600'}}>AI Dashboard Creator</p>
                <p style={{color: '#94a3b8', fontSize: '14px'}}>Powered by Advanced AI</p>
              </div>
            </div>
            <div style={{color: '#94a3b8', fontSize: '14px'}}>
              Transformando datos en decisiones inteligentes
            </div>
          </div>
        </div>
      </footer>

      {/* CSS para la animación de spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default App;