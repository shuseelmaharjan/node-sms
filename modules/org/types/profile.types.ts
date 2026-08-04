export type ProfilePictureFile = {
  id: string;
  file_url: string | null;
  download_url?: string | null;
  file_type: string;
  original_name: string;
  size_bytes: number;
  is_temporary: boolean;
  meta: Record<string, unknown>;
  uploaded_at: string;
};

export type AccountProfile = {
  id: string;
  phone: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  role: string;
  status: string;
  profile_picture_file: ProfilePictureFile | null;
  username: string;
  registration_no: string;
  date_joined: string;
};

export type UpdateBasicInfoPayload = {
  first_name: string;
  middle_name: string;
  last_name: string;
  phone: string;
};

export type UpdateProfilePicturePayload = {
  profile_picture_file: string;
};

export type ProfileUpdateResponse = {
  updated: boolean;
  message: string;
  user: AccountProfile;
};

export type EmailChangeRequestPayload = {
  new_email: string;
};

export type EmailChangeRequestResponse = {
  sent: boolean;
  message: string;
};

export type EmailChangeVerifyPayload = {
  new_email: string;
  otp: string;
};

export type EmailChangeVerifyResponse = {
  changed: boolean;
  message: string;
  email: string;
};
