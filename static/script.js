// script.js - La magia que hace todo interactivo

class DescargadorMP3 {
    constructor() {
        this.inicializarEventos();
    }

    inicializarEventos() {
        // Cuando se hace clic en el botón de descargar
        document.getElementById('boton-descargar').addEventListener('click', () => {
            this.iniciarDescarga();
        });
    }

    async iniciarDescarga() {
    // Obtenemos los enlaces del textarea
    const cajaEnlaces = document.getElementById('caja-enlaces');
    const enlaces = cajaEnlaces.value.trim();

    // Obtenemos el formato seleccionado
    const selectorFormato = document.getElementById('selector-formato');
    const formato = selectorFormato.value; // 'mp3' o 'mp4'

    // Verificamos que haya enlaces
    if (!enlaces) {
        alert('⚠️ Por favor, pega al menos un enlace de YouTube');
        return;
    }

    // Mostramos la sección de progreso
    this.mostrarProgreso();

    try {
        // Enviamos los enlaces y el formato al servidor
        const respuesta = await fetch('/procesar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                enlaces: enlaces,
                formato: formato  // ← Agregamos el formato aquí
            })
        });

        const datos = await respuesta.json();

        // Mostramos los resultados
        this.mostrarResultados(datos);

    } catch (error) {
        console.error('Error:', error);
        this.mostrarError('😨 Ocurrió un error al conectar con el servidor');
    }
}

    mostrarProgreso() {
        // Mostramos las secciones de progreso y ocultamos resultados anteriores
        document.getElementById('seccion-progreso').style.display = 'block';
        document.getElementById('seccion-resultados').style.display = 'none';
        
        // Animamos la barra de progreso
        this.animarBarraProgreso();
    }

    animarBarraProgreso() {
        const relleno = document.getElementById('relleno-progreso');
        const texto = document.getElementById('texto-progreso');
        let progreso = 0;

        const animacion = setInterval(() => {
            progreso += Math.random() * 10;
            if (progreso > 90) {
                progreso = 90;
            }
            relleno.style.width = progreso + '%';
            texto.textContent = this.obtenerMensajeProgreso(progreso);
        }, 500);

        // Guardamos el intervalo para limpiarlo después
        this.intervaloProgreso = animacion;
    }

    obtenerMensajeProgreso(progreso) {
        const mensajes = [
            "🔍 Analizando enlaces...",
            "📥 Preparando descargas...",
            "🎵 Convirtiendo enlace...",
            "✨ Casi listo...",
            "⏳ Un momento más..."
        ];
        
        const indice = Math.floor(progreso / 20);
        return mensajes[Math.min(indice, mensajes.length - 1)];
    }

    mostrarResultados(datos) {
        // Limpiamos la animación de progreso
        if (this.intervaloProgreso) {
            clearInterval(this.intervaloProgreso);
        }

        // Ocultamos progreso y mostramos resultados
        document.getElementById('seccion-progreso').style.display = 'none';
        document.getElementById('seccion-resultados').style.display = 'block';

        // Actualizamos la barra de progreso al 100%
        document.getElementById('relleno-progreso').style.width = '100%';
        document.getElementById('texto-progreso').textContent = '✅ ¡Completado!';

        // Actualiza el texto de progreso al 100% con el formato
        const formato = document.getElementById('selector-formato').value;
        document.getElementById('texto-progreso').textContent = 
        `✅ ¡Completado! Formatos: ${formato.toUpperCase()}`

        // Generamos la lista de resultados
        this.generarListaResultados(datos);
    }

    generarListaResultados(datos) {
        const lista = document.getElementById('lista-resultados');
        
        let html = `
            <div class="item-resultado" style="background: #e7f3ff;">
                <strong>Resumen:</strong><br>
                📊 Total de enlaces: ${datos.total}<br>
                ✅ Descargados: ${datos.descargados}<br>
                ❌ Errores: ${datos.total - datos.descargados}<br>
                🎯 Formato: ${datos.formato_seleccionado.toUpperCase()}
            </div>
        `;

        datos.resultados.forEach(resultado => {
            const clase = resultado.exito ? 'exito' : 'error';
            const icono = resultado.exito ? 
                (datos.formato_seleccionado === 'mp3' ? '🎵' : '🎬') : '❌';
            
            html += `
                <div class="item-resultado ${clase}">
                    <strong>${icono} ${resultado.titulo || 'Enlace'}</strong><br>
                    <small>${resultado.mensaje}</small>
                    ${resultado.exito ? `
                        <br>
                        <small>
                            📁 Archivo: ${resultado.archivo}
                            ${resultado.archivo ? 
                                `<br><a href="/descargar/${resultado.archivo}" class="enlace-descarga">📥 Descargar archivo</a>` 
                                : ''
                            }
                        </small>
                    ` : ''}
                </div>
            `;
        });

        lista.innerHTML = html;
    }

    mostrarError(mensaje) {
        const lista = document.getElementById('lista-resultados');
        lista.innerHTML = `
            <div class="item-resultado error">
                <strong>❌ Error</strong><br>
                ${mensaje}
            </div>
        `;
        
        document.getElementById('seccion-progreso').style.display = 'none';
        document.getElementById('seccion-resultados').style.display = 'block';
    }
}

// Inicializamos la aplicación cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
    new DescargadorMP3();
    console.log('🎵 Descargador MP3 listo para usar!');
});