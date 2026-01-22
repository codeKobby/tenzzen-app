"use client";

import * as pdfjs from 'pdfjs-dist';

// Configure worker
if (typeof window !== "undefined") {
    // We use unpkg via CDN for the worker to avoid complex bundler setup
    // This is a common strategy for Next.js apps with pdf.js
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileText,
    Link2,
    Upload,
    Loader2,
    Sparkles,
    FileUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMaterials } from "@/hooks/use-materials";
import { toast } from "sonner";

interface AddMaterialDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type MaterialType = "pdf" | "doc" | "txt" | "url";

const materialTypes = [
    {
        id: "url" as MaterialType,
        label: "Web Link",
        icon: Link2,
        description: "Article, blog, or webpage",
    },
    {
        id: "pdf" as MaterialType,
        label: "PDF Document",
        icon: FileText,
        description: "Upload a PDF file",
    },
    {
        id: "txt" as MaterialType,
        label: "Plain Text",
        icon: FileUp,
        description: "Paste text content",
    },
];

export function AddMaterialDialog({
    open,
    onOpenChange,
}: AddMaterialDialogProps) {
    const { createMaterial } = useMaterials();

    const [step, setStep] = useState<"type" | "details">("type");
    const [selectedType, setSelectedType] = useState<MaterialType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [sourceUrl, setSourceUrl] = useState("");
    const [textContent, setTextContent] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");

    const resetForm = () => {
        setStep("type");
        setSelectedType(null);
        setTitle("");
        setSourceUrl("");
        setTextContent("");
        setCategory("");
        setTags("");
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleTypeSelect = (type: MaterialType) => {
        setSelectedType(type);
        setStep("details");
    };

    const handleSubmit = useCallback(async () => {
        if (!selectedType || !title.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            await createMaterial({
                title: title.trim(),
                fileType: selectedType,
                sourceUrl: selectedType === "url" ? sourceUrl : undefined,
                extractedText: selectedType === "txt" ? textContent : undefined,
                category: category || undefined,
                tags: tags
                    ? tags.split(",").map((t) => t.trim())
                    : undefined,
            });

            toast.success("Material added successfully!", {
                description: "AI will analyze and find related videos shortly.",
            });

            handleClose();
        } catch (error) {
            console.error("Error creating material:", error);
            toast.error("Failed to add material");
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedType, title, sourceUrl, textContent, category, tags, createMaterial]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Add Learning Material
                    </DialogTitle>
                    <DialogDescription>
                        {step === "type"
                            ? "Choose the type of material you want to add"
                            : "Fill in the details for your material"}
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === "type" ? (
                        <motion.div
                            key="type"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid gap-3 py-4"
                        >
                            {materialTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeSelect(type.id)}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl border-2 border-border/50",
                                        "hover:border-primary/50 hover:bg-muted/50 transition-all",
                                        "text-left group"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "h-12 w-12 rounded-lg flex items-center justify-center",
                                            "bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors"
                                        )}
                                    >
                                        <type.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{type.label}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {type.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4 py-4"
                        >
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Introduction to Machine Learning"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* Type-specific fields */}
                            {selectedType === "url" && (
                                <div className="space-y-2">
                                    <Label htmlFor="url">URL *</Label>
                                    <Input
                                        id="url"
                                        type="url"
                                        placeholder="https://example.com/article"
                                        value={sourceUrl}
                                        onChange={(e) => setSourceUrl(e.target.value)}
                                    />
                                </div>
                            )}

                            {selectedType === "txt" && (
                                <div className="space-y-2">
                                    <Label htmlFor="content">Content</Label>
                                    <Textarea
                                        id="content"
                                        placeholder="Paste your text content here..."
                                        className="min-h-[120px] resize-none"
                                        value={textContent}
                                        onChange={(e) => setTextContent(e.target.value)}
                                    />
                                </div>
                            )}

                            {selectedType === "pdf" && (
                                <div className="space-y-2">
                                    <Label>Upload PDF</Label>
                                    <div
                                        className={cn(
                                            "border-2 border-dashed border-border/50 rounded-xl p-8",
                                            "flex flex-col items-center justify-center text-center",
                                            "hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer",
                                            "relative"
                                        )}
                                        onClick={() => document.getElementById("pdf-upload")?.click()}
                                    >
                                        <input
                                            id="pdf-upload"
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                try {
                                                    // Set title if empty
                                                    if (!title) {
                                                        setTitle(file.name.replace(".pdf", ""));
                                                    }

                                                    // Show loading state
                                                    const loadingToast = toast.loading("Processing PDF...");

                                                    // Read file
                                                    const arrayBuffer = await file.arrayBuffer();

                                                    // Load PDF
                                                    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                                                    let fullText = "";

                                                    // Extract text from all pages
                                                    for (let i = 1; i <= pdf.numPages; i++) {
                                                        const page = await pdf.getPage(i);
                                                        const content = await page.getTextContent();
                                                        const pageText = content.items
                                                            .map((item: any) => item.str)
                                                            .join(" ");
                                                        fullText += pageText + "\n\n";
                                                    }

                                                    setTextContent(fullText);
                                                    toast.dismiss(loadingToast);
                                                    toast.success("PDF processed successfully!", {
                                                        description: `${pdf.numPages} pages extracted.`
                                                    });

                                                } catch (error) {
                                                    console.error("PDF Parsing error:", error);
                                                    toast.error("Failed to process PDF", {
                                                        description: "Please try a text-based PDF (not scanned)."
                                                    });
                                                }
                                            }}
                                        />
                                        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                                        <p className="text-sm font-medium">
                                            {textContent ? "PDF Processed!" : "Click to upload or drag and drop"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {textContent ? `${textContent.length} characters extracted` : "PDF up to 10MB"}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        We extract text from your PDF to generate summaries and flashcards.
                                    </p>
                                </div>
                            )}

                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="programming">Programming</SelectItem>
                                        <SelectItem value="math">Mathematics</SelectItem>
                                        <SelectItem value="science">Science</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="design">Design</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    placeholder="python, machine-learning, beginner"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Separate tags with commas
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep("type")}
                                    disabled={isSubmitting}
                                >
                                    Back
                                </Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Add Material
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
