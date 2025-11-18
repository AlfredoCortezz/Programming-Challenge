// src/reportWebVitals.ts

const reportWebVitals = (onPerfEntry?: any) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    import("web-vitals").then(({ onCLS, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
