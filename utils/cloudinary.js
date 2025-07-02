// Cloudinary upload utility
// Usage: await uploadToCloudinary(localUri, 'your_upload_preset');
export async function uploadToCloudinary(uri, uploadPreset) {
  const apiUrl = 'https://api.cloudinary.com/v1_1/dmlsf2eac/image/upload'; // Replace 'democloud' with your Cloudinary cloud name
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  });
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  const data = await response.json();
  if (!data.secure_url) throw new Error('Cloudinary upload failed');
  return data.secure_url;
}
