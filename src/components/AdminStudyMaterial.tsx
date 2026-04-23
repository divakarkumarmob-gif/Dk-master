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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleUpload = async () => {
    if (!subject || !type || !name.trim() || !file) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

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
          showToast('Upload failed!', 'error');
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
          showToast('Upload successfully!', 'success');
          setFile(null);
          setName('');
        }
      );
    } catch (e: any) {
      console.error(e);
      showToast('Upload error!', 'error');
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto -mt-10 overflow-visible relative">
      {/* Toast Notifications */}
      {toast && (
        <div className={cn(
          "fixed top-10 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-black text-sm shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300",
          toast.type === 'success' ? "bg-white text-green-600" : "bg-white text-red-600"
        )}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
          {toast.message}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20 shadow-xl">
          <label className="block text-[10px] font-black text-white/50 uppercase tracking-[4px] mb-4 text-center">1. Choose Subject</label>
          <div className="grid grid-cols-3 gap-3">
            {['Physics', 'Chemistry', 'Biology'].map((subj) => (
              <button
                key={subj}
                onClick={() => setSubject(subj as any)}
                className={cn(
                  "py-4 rounded-2xl font-black text-xs transition-all duration-300 transform",
                  subject === subj 
                    ? "bg-white text-blue-600 scale-95 shadow-xl shadow-white/20" 
                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                )}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20 shadow-xl">
          <label className="block text-[10px] font-black text-white/50 uppercase tracking-[4px] mb-4 text-center">2. Material Type</label>
          <div className="grid grid-cols-2 gap-3">
            {['NCERT', 'Module'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t as any)}
                className={cn(
                  "py-4 rounded-2xl font-black text-xs transition-all duration-300 transform",
                  type === t 
                    ? "bg-white text-blue-600 scale-95 shadow-xl shadow-white/20" 
                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20 shadow-xl">
          <label className="block text-[10px] font-black text-white/50 uppercase tracking-[4px] mb-4 text-center">3. Details & Selection</label>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Topic or Chapter Name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 font-bold focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            
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
                className={cn(
                  "w-full bg-white/5 border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                  file ? "border-green-400/50 bg-green-400/10 text-green-400" : "border-white/10 text-white/30 hover:border-white/30 hover:bg-white/5"
                )}
              >
                <FileText className="mb-2" size={48} />
                {file ? (
                  <span className="font-black text-sm text-center line-clamp-1 px-4">{file.name}</span>
                ) : (
                  <span className="font-black text-[10px] uppercase tracking-[4px]">Select PDF File</span>
                )}
              </label>
            </div>
          </div>
        </div>

        {isUploading ? (
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 overflow-hidden relative shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-[4px]">Uploading...</span>
              <span className="text-[10px] font-black text-white">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.8)]" 
                style={{ width: `${uploadProgress}%` }} 
              />
            </div>
          </div>
        ) : (
          <button 
            disabled={!subject || !type || !name.trim() || !file}
            onClick={handleUpload}
            className={cn(
              "w-full h-20 rounded-[2.5rem] font-black uppercase tracking-[8px] text-sm transition-all duration-300 transform active:scale-95 shadow-2xl",
              (!subject || !type || !name.trim() || !file)
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-white text-blue-600 hover:shadow-white/40 hover:-translate-y-1"
            )}
          >
            Start Upload
          </button>
        )}
      </div>
    </div>
  );
}
