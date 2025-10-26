import { useRef, useState } from "react";
import { api } from "../../lib/api";

export default function FileDropzone({ onUploaded }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files) {
    const file = files[0];
    if (!file) return;
    setBusy(true); setProgress(0);

    // 1) init upload (on récupère un fileId et éventuellement un uploadUrl si S3)
    const { data: init } = await api.post("/uploads/init", {
      filename: file.name, type: file.type, size: file.size
    });

    // 2) upload binaire
    await api.put(init.uploadUrl || `/uploads/${init.fileId}`, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      },
    });

    setBusy(false);
    onUploaded?.(init.fileId);
  }

  return (
    <div className="border border-dashed border-neutral-700 rounded p-4">
      <div
        onDragOver={(e)=>e.preventDefault()}
        onDrop={(e)=>{e.preventDefault(); handleFiles(e.dataTransfer.files);}}
        className="text-center py-6 cursor-pointer"
        onClick={()=>inputRef.current?.click()}
      >
        <p className="text-sm text-neutral-300">Glisser-déposer ou cliquer pour sélectionner</p>
        {busy ? <p className="text-xs mt-2">Upload… {progress}%</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e)=>handleFiles(e.target.files)}
        accept="image/*,video/*,application/pdf"
      />
    </div>
  );
}
