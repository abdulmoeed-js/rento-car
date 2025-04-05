
# Admin KYC Verification System

This KYC verification system allows administrators to review and approve/reject user license uploads. Here's how to get started:

## Setup Instructions

1. First, make sure to run the SQL migrations to create the necessary tables. These migrations will:
   - Add KYC-related columns to the profiles table
   - Create a table for KYC review logs
   - Set up user roles and admin functions

2. Create your first admin user by running this SQL in the Supabase SQL Editor:
   ```sql
   SELECT public.make_admin('your-email@example.com');
   ```
   Replace 'your-email@example.com' with the email of the user you want to make an admin.

3. Access the admin KYC page at: `/admin/kyc`

## Features

- **Review Pending Verifications**: See all users who have uploaded their licenses and are waiting for verification.
- **View User Details**: Check user information and their uploaded license image.
- **Take Actions**: Approve, reject, or request a reupload with a specified reason.
- **Audit Trail**: All actions are logged with timestamps and reviewer information.

## Action Types

1. **Approve**: Verifies the user's license, allowing them to use all platform features.
2. **Reject**: Marks the license as rejected. The user will need to contact support.
3. **Request Reupload**: Asks the user to upload a clearer image of their license.

## Best Practices

- Always provide a clear reason when rejecting a license or requesting a reupload.
- Process oldest verifications first to maintain good user experience.
- Check the image quality and legibility before approving.
