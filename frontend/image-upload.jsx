// ─────────────────────────────────────────────────────────────────────
// ImageUploadButton — upload image and insert markdown ![](url)
// ─────────────────────────────────────────────────────────────────────

function ImageUploadButton({ onInsert }) {
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(API_BASE + '/images', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        const imgUrl = data.url.startsWith('/') && window.location.port === '3000' ? 'http://localhost:8000' + data.url : data.url;
        onInsert(`![${file.name}](${imgUrl})`);
      } catch (err) {
        console.error('Image upload failed:', err);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={handleUpload}
      disabled={uploading}
      style={{ fontSize: 12 }}
      title="Attach image"
    >
      {uploading ? '...' : <><Icons.Plus size={10}/> Image</>}
    </button>
  );
}

// Paste handler — intercepts image paste and uploads
// Uses interval to detect when textarea ref becomes available (e.g. after step change)
function useImagePaste(textareaRef, onInsert) {
  const [el, setEl] = React.useState(null);
  React.useEffect(() => {
    const check = setInterval(() => {
      if (textareaRef.current && textareaRef.current !== el) setEl(textareaRef.current);
    }, 300);
    return () => clearInterval(check);
  });
  React.useEffect(() => {
    if (!el) return;
    const handler = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          const fd = new FormData();
          fd.append('file', file);
          try {
            const res = await fetch(API_BASE + '/images', { method: 'POST', body: fd });
            if (res.ok) {
              const data = await res.json();
              const imgUrl = data.url.startsWith('/') && window.location.port === '3000' ? 'http://localhost:8000' + data.url : data.url;
              onInsert(`![image](${imgUrl})`);
            }
          } catch {}
          break;
        }
      }
    };
    el.addEventListener('paste', handler);
    return () => el.removeEventListener('paste', handler);
  }, [el, onInsert]);
}

Object.assign(window, { ImageUploadButton, useImagePaste });
