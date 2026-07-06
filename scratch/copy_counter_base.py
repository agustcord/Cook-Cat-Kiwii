import os
import shutil

brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"
output_dir = r"public\assets\backgrounds"
output_file = os.path.join(output_dir, "bakery_counter_base.png")

def main():
    # Encontrar la imagen del mostrador panorámico generado en el brain
    files = os.listdir(brain_dir)
    matching = [f for f in files if f.startswith("empty_bakery_counter_base_800x360_") and f.endswith(".png")]
    
    if not matching:
        print("ERROR: No se encontró la imagen del mostrador en el brain.")
        return
        
    matching.sort()
    src_file = os.path.join(brain_dir, matching[-1])
    
    os.makedirs(output_dir, exist_ok=True)
    shutil.copy(src_file, output_file)
    print(f"Mostrador copiado exitosamente a: {output_file}")

if __name__ == "__main__":
    main()
