#!/usr/bin/env python3
"""
Script de validación de datos para la aplicación
Ejecutar cuando la aplicación esté disponible
"""
import requests
import pandas as pd

def validar_datos_aplicacion():
    """Valida que los datos de la aplicación coincidan con el Excel"""
    
    # Datos esperados del Excel
    datos_excel = {
        "total_casos": 289,
        "fee_total": 12930.00,
        "costo_usd_total": 76343.49,
        "monto_agregado_total": 4649.56,
        "total_completo": 93923.05,
        "casos_con_fee": 143,
        "casos_con_costo_usd": 92,
        "casos_con_monto_agregado": 4,
        "monedas": {
            "USD": {"suma": 30825.38, "casos": 62},
            "ARS": {"suma": 478112.00, "casos": 4},
            "EUR": {"suma": 1650.79, "casos": 4},
            "MXN": {"suma": 3808.00, "casos": 1}
        }
    }
    
    try:
        # Obtener datos de la aplicación
        response = requests.get('http://localhost:3000/api/casos')
        if response.status_code != 200:
            print(f"Error: No se pudo conectar a la aplicación (HTTP {response.status_code})")
            return
        
        data = response.json()
        df_app = pd.DataFrame(data)
        
        # Calcular estadísticas de la aplicación
        fee_app = df_app['fee'].fillna(0).sum()
        costo_usd_app = df_app['costoUsd'].fillna(0).sum()
        monto_agregado_app = df_app['montoAgregado'].fillna(0).sum()
        total_app = fee_app + costo_usd_app + monto_agregado_app
        
        # Comparar totales
        print("=== VALIDACIÓN DE DATOS ===")
        print(f"Total casos - Excel: {datos_excel['total_casos']}, App: {len(df_app)}")
        print(f"Fee total - Excel: ${datos_excel['fee_total']:.2f}, App: ${fee_app:.2f}")
        print(f"Costo USD - Excel: ${datos_excel['costo_usd_total']:.2f}, App: ${costo_usd_app:.2f}")
        print(f"Monto Agregado - Excel: ${datos_excel['monto_agregado_total']:.2f}, App: ${monto_agregado_app:.2f}")
        print(f"Total Completo - Excel: ${datos_excel['total_completo']:.2f}, App: ${total_app:.2f}")
        
        # Verificar discrepancias
        discrepancias = []
        if len(df_app) != datos_excel['total_casos']:
            discrepancias.append(f"Total casos: diff = {len(df_app) - datos_excel['total_casos']}")
        if abs(fee_app - datos_excel['fee_total']) > 0.01:
            discrepancias.append(f"Fee: diff = ${fee_app - datos_excel['fee_total']:.2f}")
        if abs(costo_usd_app - datos_excel['costo_usd_total']) > 0.01:
            discrepancias.append(f"Costo USD: diff = ${costo_usd_app - datos_excel['costo_usd_total']:.2f}")
        
        if discrepancias:
            print("\n⚠️ DISCREPANCIAS ENCONTRADAS:")
            for disc in discrepancias:
                print(f"  - {disc}")
        else:
            print("\n✅ No se encontraron discrepancias significativas")
            
    except Exception as e:
        print(f"Error durante la validación: {e}")

if __name__ == "__main__":
    validar_datos_aplicacion()
