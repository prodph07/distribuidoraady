/**
 * Compresses and resizes an image file using HTML5 Canvas.
 * @param file The original image file.
 * @param maxWidth The maximum width for the compressed image.
 * @param quality The JPEG quality (0 to 1).
 * @returns A Promise that resolves to the compressed Blob.
 */
export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            image.src = e.target?.result as string;
        };

        reader.onerror = (error) => reject(error);

        image.onload = () => {
            const canvas = document.createElement("canvas");
            let width = image.width;
            let height = image.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Draw image on white background (handle PNG transparency turning black in JPEG)
            ctx.fillStyle = "#FFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(image, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Compression failed"));
                    }
                },
                "image/jpeg",
                quality
            );
        };

        reader.readAsDataURL(file);
    });
}
