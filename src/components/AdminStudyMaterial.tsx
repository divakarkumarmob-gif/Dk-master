import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { db, storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

export function AdminStudyMaterial() {
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Biology' | null>(null);
  const [type, setType] = useState<'NCERT' | 'Module' | null>(null);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!subject || !type || !name.trim() || !file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setSuccess(false);

    try {
      // Create a unique file name
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
      const storageRef = ref(storage, `study_materials/${subject}/${type}/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed", error);
          setIsUploading(false);
          alert('Upload failed: ' + error.message);
        }, 
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, 'study_materials'), {
            title: name.trim(),
            subject,
            type,
            url: downloadURL,
            fileName: file.name,
            size: file.size,
            createdAt: serverTimestamp()
          });

          setIsUploading(false);
          setSuccess(true);
          setFile(null);
          setName('');
          setTimeout(() => setSuccess(false), 3000);
        }
      );
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Upload className="text-orange-500" />
        Upload Study Material
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Subject</label>
          <div className="grid grid-cols-3 gap-2">
            {['Physics', 'Chemistry', 'Biology'].map((subj) => (
              <button
                key={subj}
                onClick={() => setSubject(subj as any)}
                className={cn(
                  "py-3 rounded-xl font-bold text-sm transition-colors border",
                  subject === subj ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Material Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['NCERT', 'Module'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t as any)}
                className={cn(
                  "py-3 rounded-xl font-bold text-sm transition-colors border",
                  type === t ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Chapter / Notes Name</label>
          <input 
            type="text" 
            placeholder="e.g. Electric Charges and Fields"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select PDF</label>
          <div className="relative">
            <input 
              type="file" 
              accept=".pdf"
              id="file-upload"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="hidden"
            />
            <label 
              htmlFor="file-upload" 
              className="w-full bg-slate-50 border-2 border-dashed border-slate-300 p-6 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-colors"
            >
              <FileText className={cn("mb-2", file ? "text-orange-500" : "text-slate-400")} size={32} />
              {file ? (
                <span className="font-bold text-sm text-slate-700 text-center">{file.name}</span>
              ) : (
                <span className="font-bold text-sm text-slate-500">Tap to browse PDF (2-4 MB)</span>
              )}
            </label>
          </div>
        </div>

        <button 
          disabled={!subject || !type || !name.trim() || !file || isUploading}
          onClick={handleUpload}
          className="w-full bg-slate-900 text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex py-4 justify-center items-center gap-2 relative overflow-hidden"
        >
          {isUploading ? (
             <>
               <Loader2 size={20} className="animate-spin relative z-10" />
               <span className="relative z-10">Uploading... {Math.round(uploadProgress)}%</span>
               <div className="absolute inset-0 bg-slate-700 pointer-events-none" style={{ width: `${uploadProgress}%` }} />
             </>
          ) : success ? (
             <>
               <CheckCircle size={20} className="text-emerald-400" />
               <span>Upload Complete</span>
             </>
          ) : (
             <>
               <Upload size={20} />
               <span>Upload Material</span>
             </>
          )}
        </button>
      </div>
    </div>
  );
}
