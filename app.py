# app.py - El cerebro de nuestra aplicación
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import yt_dlp
import os
import time
import secrets
import subprocess

# Creamos la aplicación Flask
app = Flask(__name__)

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["50 por dia", "10 por hora"]
)

# Esta llave protege tu página
app.secret_key = secrets.token_hex(16)

# Configuración para las descargas
DOWNLOAD_FOLDER = 'downloads'

# Aseguramos que la carpeta de descargas exista
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

@app.route('/')
def pagina_principal():
    """Esta función muestra la página principal"""
    return render_template('index.html')

@app.route('/procesar', methods=['POST'])
@limiter.limit("5 por minuto")
def procesar_enlaces():
    """Esta función procesa los enlaces de YouTube para MP3 o MP4"""
    
    # Obtenemos los datos que envía el usuario
    datos = request.get_json()
    enlaces_texto = datos.get('enlaces', '')
    formato = datos.get('formato', 'mp3')  # 'mp3' o 'mp4'
    
    # Separamos los enlaces por punto y coma
    lista_enlaces = [enlace.strip() for enlace in enlaces_texto.split(';') if enlace.strip()]
    
    # Verificar FFmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        ffmpeg_disponible = True
    except:
        ffmpeg_disponible = False
    
    resultados = []
    
    for enlace in lista_enlaces:
        try:
            if formato == 'mp3':
                # CONFIGURACIÓN PARA MP3 (AUDIO)
                if ffmpeg_disponible:
                    configuracion = {
                        'format': 'bestaudio/best',
                        'postprocessors': [{
                            'key': 'FFmpegExtractAudio',
                            'preferredcodec': 'mp3',
                            'preferredquality': '192',
                        }],
                        'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
                        'quiet': True,
                    }
                else:
                    # Si no hay FFmpeg, descargar mejor audio disponible
                    configuracion = {
                        'format': 'bestaudio/best',
                        'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
                        'quiet': True,
                    }
                    
            else:  # formato == 'mp4'
                # CONFIGURACIÓN PARA MP4 (VIDEO)
                configuracion = {
                    'format': 'best[height<=720]',  # Calidad máxima 720p
                    'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
                    'quiet': True,
                }
            
            # Realizar la descarga
            with yt_dlp.YoutubeDL(configuracion) as ydl:
                info = ydl.extract_info(enlace, download=True)
                
                # Obtener el nombre del archivo descargado
                archivo_descargado = ydl.prepare_filename(info)
                
                # Si es MP3 con FFmpeg, el archivo final es .mp3
                if formato == 'mp3' and ffmpeg_disponible:
                    archivo_final = archivo_descargado.replace('.webm', '.mp3').replace('.m4a', '.mp3')
                else:
                    archivo_final = archivo_descargado
                
                resultados.append({
                    'exito': True,
                    'titulo': info.get('title', 'Sin título'),
                    'enlace': enlace,
                    'formato': formato.upper(),
                    'archivo': os.path.basename(archivo_final),
                    'mensaje': f'✅ Descargado como {formato.upper()}'
                })
                
        except Exception as error:
            resultados.append({
                'exito': False,
                'enlace': enlace,
                'mensaje': f'❌ Error: {str(error)}'
            })
    
    return jsonify({
        'total': len(lista_enlaces),
        'descargados': len([r for r in resultados if r['exito']]),
        'formato_seleccionado': formato,
        'ffmpeg_instalado': ffmpeg_disponible,
        'resultados': resultados
    })

@app.route('/descargar/<nombre_archivo>')
def descargar_archivo(nombre_archivo):
    """Esta función permite descargar el archivo (MP3 o MP4)"""
    return send_from_directory(DOWNLOAD_FOLDER, nombre_archivo, as_attachment=True)

#Ejecuta localmente
#if __name__ == '__main__':
#    print("🎵 Iniciando el Descargador de MP3...")
#    print("🌐 Abre tu navegador y ve a: http://localhost:5000")
#    app.run(host='0.0.0.0', port=5000, debug=True)