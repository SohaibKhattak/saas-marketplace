import multer from "multer";    
// Configure multer for avatar uploads (memory storage for direct upload to Supabase)
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req:any, file:any, cb:any) => {
    console.log('File filter called', { filename: file.originalname, mimetype: file.mimetype });
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});
