"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string;
    onChange: (fileOrUrl: File | string | null) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

export function ImageUpload({
    value,
    onChange,
    disabled,
    className,
    placeholder = "Clique para selecionar uma imagem"
}: ImageUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);

    // Sync external value changes
    useEffect(() => {
        setPreviewUrl(value || null);
    }, [value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            onChange(file);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onChange(null); // Clear value
    };

    return (
        <div className={cn("space-y-4 w-full", className)}>
            <div className="flex flex-col gap-4">
                {previewUrl ? (
                    <div className="relative w-full aspect-video bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 group">
                        <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="object-contain"
                        />
                        {!disabled && (
                            <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                onClick={handleRemove}
                                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </Button>
                        )}
                    </div>
                ) : (
                    <label className={cn(
                        "flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer bg-neutral-900/50 hover:bg-neutral-800/50 hover:border-primary/50 transition-colors",
                        disabled && "opacity-50 cursor-not-allowed hover:bg-neutral-900/50 hover:border-neutral-700"
                    )}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
                            <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                            <p className="text-sm text-neutral-400">{placeholder}</p>
                            <p className="text-xs text-neutral-500 mt-1">PNG, JPG ou WEBP</p>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={disabled}
                        />
                    </label>
                )}
            </div>
        </div>
    );
}
