import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEditor } from "@/providers/agent-provider";
import { useNodeId } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, File, CheckCircle2, Trash2, Edit3 } from "lucide-react";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import Cookies from "js-cookie";
import { useToast } from "@/components/ui/use-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const formSchema = z.object({
  file: z
    .instanceof(window.File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File size must not exceed 10MB")
    .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), "Only PDF, DOCX, and TXT files are allowed"),
});

type FormValues = z.infer<typeof formSchema>;

const FileUploadCardHandler: React.FC = () => {
  const { dispatch, state } = useEditor();
  const nodeId = useNodeId();
  const node = state.editor.elements.find((node) => node.id === nodeId);
  const metadata = node?.data.metadata;
  const toast = useToast()
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [replacingFile, setReplacingFile] = useState(false); // To handle file replacement state

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = Cookies.get("token");

    const response = await fetch(`${BACKEND_API_BASE_URL}/cloud/file-upload`, {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return data.url;
  };

  const updateNodeData = (fileData: any) => {
      dispatch({
        type: "LOAD_DATA",
        payload: {
          ...state.editor,
          elements: state.editor.elements.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, metadata: fileData } }
              : node
          ),
        },
      });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsUploading(true);
      setUploadSuccess(false);

      // Simulate progress for UI
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 200);

      const fileUrl = await uploadFile(values.file);
      const fileData = {
        name: values.file.name,
        size: values.file.size,
        type: values.file.type,
        url: fileUrl,
      };

      updateNodeData(fileData);
      setUploadSuccess(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
      setReplacingFile(false); // Reset replacement state after upload
    }
  };

  const handleDeleteFile = async () => {
    try {
    // Fetch the presigned URL for deletion from the backend
    const token = Cookies.get("token");
    const response = await fetch(`${BACKEND_API_BASE_URL}/cloud/file-delete`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileUrl: metadata.url }), // Pass file URL or key to backend
    });

    if (!response.ok) {
      throw new Error("Failed to get delete URL");
    }
  } catch (error) {
    toast.toast({
      title: "Failed to delete file",
      description: (error as Error).message,
      variant: "destructive",
    })
  }
    updateNodeData({});
    form.reset();
    location.reload()
  };

  const handleReplaceFile = () => {
    setReplacingFile(true);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>File Upload</AccordionTrigger>
        <AccordionContent>
          {metadata?.url && !replacingFile ? (
            <div className="space-y-4">
              {/* Display file details when it exists */}
              <Alert>
                <File className="h-4 w-4" />
                <AlertDescription>
                  <strong>File name:</strong> {metadata.name} <br />
                  <strong>Type:</strong> {metadata.type} <br />
                  <strong>Size:</strong> {(metadata.size / 1024 / 1024).toFixed(2)} MB
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Button onClick={handleReplaceFile} variant="secondary" className="w-full">
                  <Edit3 className="mr-2 h-4 w-4" /> Replace File
                </Button>
                <Button onClick={handleDeleteFile} variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete File
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Upload File</FormLabel>
                      <FormControl>
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="dropzone-file"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                PDF, DOCX, or TXT (MAX. 10MB)
                              </p>
                            </div>
                            <input
                              id="dropzone-file"
                              type="file"
                              className="hidden"
                              accept=".pdf,.docx,.txt"
                              onChange={(e) => field.onChange(e.target.files?.[0])}
                            />
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        Upload a text-based file (PDF, DOCX, TXT) with a maximum size of 10MB.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                {form.watch("file") && (
                  <Alert>
                    <File className="h-4 w-4" />
                    <AlertDescription>{form.watch("file")?.name}</AlertDescription>
                  </Alert>
                )}
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                {uploadSuccess && (
                  <Alert className="bg-green-100 border-green-400 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>File uploaded successfully!</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isUploading || !form.watch("file")}>
                  {isUploading ? "Uploading..." : "Upload File"}
                </Button>
              </form>
            </Form>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default FileUploadCardHandler;
