"use client";

// hooks
import { useEffect, useState } from "react";
import { useGet, usePatch } from "@/app/hooks/useApi";

// components
import AccountInfo from "../../client-components/profile/AccountInfo";
import EducationCard from "../../client-components/profile/EducationCard";
import PersonalInfo from "../../client-components/profile/PersonalInfo";
import ProfessionalInfo from "../../client-components/profile/ProfessionalInfo";
import ProfileHeader from "../../client-components/profile/ProfileHeader";
import ProfileSidebar from "../../client-components/profile/ProfileSidebar";
import ResumeCard from "../../client-components/profile/ResumeCard";
import SkillsCard from "../../client-components/profile/SkillsCard";
import SocialLinks from "../../client-components/profile/SocialLinks";

// types
import { ApiResponse } from "@/types/apiResponse/response";
import { User } from "@/types/user";

export default function ProfilePage() {
  const [profile, setProfile] = useState<User | null>({
    _id: "",
    fullName: "",
    email: "",
    phone: "",
    currentLocation: "",
    currentJobTitle: "",
    socialLinks: {
      portfolio: "",
      github: "",
      linkedin: "",
    },
    education: {
      degree: "",
      university: "",
      passingYear: "",
    },
    skills: [],
    resume: "",
    avatar: "",
    role: "user",
    yearsOfExperience: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const { getData, loading } = useGet<ApiResponse<User>>("/profile");
  const { patchData } = usePatch<ApiResponse<User>, Partial<User>>("/profile");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getData();
        const user = response?.data;
        if (response?.success) {
          setProfile(user);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [getData]);

  const handleProfileUpdate = async () => {
    try {
      const response = await patchData(profile as Partial<User>);
      if (response?.success) {
        setProfile(response.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto gap-6 px-4 py-8 w-full">
      <ProfileSidebar
        user={profile}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        setProfile={setProfile}
      />
      <ProfileHeader
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        handleUpdate={handleProfileUpdate}
      />
      <PersonalInfo
        user={profile}
        isEditing={isEditing}
        setProfile={setProfile}
      />
      <ProfessionalInfo
        user={profile}
        isEditing={isEditing}
        setProfile={setProfile}
      />
      <EducationCard
        user={profile}
        isEditing={isEditing}
        setProfile={setProfile}
      />
      <SkillsCard
        user={profile}
        isEditing={isEditing}
        setProfile={setProfile}
      />
      <ResumeCard
        user={profile}
        isEditing={isEditing}
        setProfile={setProfile}
      />
      <SocialLinks
        user={profile}
        isEditing={isEditing}
        setProfile={setProfile}
      />
      <AccountInfo user={profile} />
    </div>
  );
}
