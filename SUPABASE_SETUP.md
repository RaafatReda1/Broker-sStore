# Supabase Setup for ID Card Uploads

## 1. Database Schema Update

Run the following SQL in your Supabase SQL Editor to add the ID card URL columns:

```sql
-- Add ID card URL columns to the Brokers table
ALTER TABLE public."Brokers"
ADD COLUMN "id_card_front_url" text,
ADD COLUMN "id_card_back_url" text;

-- Add comments to the new columns
COMMENT ON COLUMN public."Brokers"."id_card_front_url" IS 'URL of the front side ID card photo stored in Supabase storage';
COMMENT ON COLUMN public."Brokers"."id_card_back_url" IS 'URL of the back side ID card photo stored in Supabase storage';

-- Create an index on auth_id for better query performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_brokers_auth_id ON public."Brokers"("auth_id");
```

## 2. Storage Bucket Setup

### Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Set the following:
   - **Name**: `Brokers'Cards`
   - **Public**: ✅ **Yes** (so we can get public URLs)
   - **File size limit**: `10MB` (adjust as needed)
   - **Allowed MIME types**: `image/*` (only allow images)

### Set Storage Policies

Create the following RLS (Row Level Security) policies for the bucket:

#### Policy 1: Allow authenticated users to upload their own files

```sql
CREATE POLICY "Users can upload their own ID cards" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'Brokers''Cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Allow users to view their own files

```sql
CREATE POLICY "Users can view their own ID cards" ON storage.objects
FOR SELECT USING (
  bucket_id = 'Brokers''Cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: Allow users to update their own files

```sql
CREATE POLICY "Users can update their own ID cards" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'Brokers''Cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Allow users to delete their own files

```sql
CREATE POLICY "Users can delete their own ID cards" ON storage.objects
FOR DELETE USING (
  bucket_id = 'Brokers''Cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 3. Storage Bucket Configuration

### Bucket Settings

- **Name**: `Brokers'Cards`
- **Public**: ✅ **Yes**
- **File size limit**: `10MB`
- **Allowed MIME types**: `image/*`

### Folder Structure

Files will be organized as:

```
Brokers'Cards/
├── {user_id}/
│   ├── id_front_{timestamp}.jpg
│   └── id_back_{timestamp}.jpg
└── ...
```

## 4. Testing the Upload

The `BrokersDataForm` component includes:

- ✅ **File validation**: Only accepts image files
- ✅ **Progress tracking**: Shows upload progress for both images
- ✅ **Error handling**: Comprehensive error handling for uploads and database operations
- ✅ **User authentication**: Checks if user is signed in before allowing submission
- ✅ **File organization**: Files are organized by user ID in folders
- ✅ **Database integration**: Stores URLs in the Brokers table
- ✅ **Form validation**: Ensures both ID card photos are uploaded
- ✅ **Responsive design**: Works on mobile and desktop

## 5. Usage

1. Import and use the `BrokersDataForm` component in your app
2. Users must be authenticated to submit broker data
3. The form will upload both ID card photos to Supabase storage
4. URLs will be automatically stored in the database
5. Progress bars show upload status
6. Success/error messages provide user feedback

## 6. Security Notes

- Files are organized by user ID to prevent unauthorized access
- RLS policies ensure users can only access their own files
- File type validation prevents non-image uploads
- File size limits prevent abuse
- All operations require authentication
