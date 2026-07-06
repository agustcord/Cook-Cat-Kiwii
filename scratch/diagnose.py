import socket
import sys

def test_dns(hostname):
    print(f"Probando resolver DNS para: {hostname}...")
    try:
        ip = socket.gethostbyname(hostname)
        print(f" -> ¡Éxito! IP: {ip}")
        return True
    except Exception as e:
        print(f" -> FAILEÓ: {e}")
        return False

def main():
    print("=== Diagnóstico de Red de Python en Windows ===")
    print(f"Versión de Python: {sys.version}\n")
    
    g_res = test_dns("google.com")
    hf_res = test_dns("huggingface.co")
    api_res = test_dns("api-inference.huggingface.co")
    
    print("\n=== Resultado del Diagnóstico ===")
    if not g_res:
        print("-> Python no puede resolver NINGÚN sitio web (ni google.com).")
        print("   Causa: Un Firewall (Windows Defender o Antivirus) está bloqueando por completo a 'python.exe',")
        print("   o tu terminal sigue estando aislada por el editor.")
    elif g_res and not api_res:
        print("-> Python puede resolver google.com pero NO huggingface.co.")
        print("   Causa: Tu proveedor de Internet (ISP) o el DNS de tu router tiene bloqueado Hugging Face,")
        print("   o hay una regla de cortafuegos específica bloqueando ese dominio.")
        print("   Solución recomendada: Cambiar el DNS de Windows a Google (8.8.8.8) o Cloudflare (1.1.1.1).")
    else:
        print("-> Todo está en orden con el DNS. El error anterior pudo ser temporal.")

if __name__ == "__main__":
    main()
