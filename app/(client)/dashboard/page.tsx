"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useProfileCompletionContext } from "../client-components/ProfileCompletionProvider";
import { GoogleStatusBanner } from "./components/GoogleStatusBanner";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatCardGrid } from "./components/StatCardGrid";
import { EmailComposer } from "./components/EmailComposer";
import { GeneratedEmailPanel } from "./components/GeneratedEmailPanel";
import { RecentActivityPanel } from "./components/RecentActivityPanel";
import { useUserProfile } from "./hooks/useUserProfile";
import { useEmailComposer } from "./hooks/useEmailComposer";
import { useDashboardActivity } from "./hooks/useDashboardActivity";

const ProfileCompletionBanner = dynamic(
  () => import("@/components/ProfileCompletionBanner"),
  { ssr: false },
);

/**
 * Dashboard page — thin composition root.
 *
 * Responsibility: compose hooks and pass data down to presentational components.
 * No API calls, no business logic, no inline styling values live here.
 */
const Dashboard = () => {
  const profile = useUserProfile();
  const composer = useEmailComposer();
  const { stats, statsLoading, recentApps, recentLoading, activitySummary } =
    useDashboardActivity();
  const completionCtx = useProfileCompletionContext();

  return (
    <div className="min-h-full bg-[#0a0a0a] p-5 lg:p-8 space-y-6">
      {/* Banners */}
      <GoogleStatusBanner />

      {completionCtx?.showBanner && completionCtx.completionData && (
        <Suspense fallback={null}>
          <ProfileCompletionBanner
            data={completionCtx.completionData}
            onDismiss={completionCtx.dismissBanner}
          />
        </Suspense>
      )}

      {/* Header */}
      <DashboardHeader
        userName={profile.userName}
        userInitial={profile.userInitial}
        userAvatar={profile.userAvatar}
        avatarImgError={profile.avatarImgError}
        setAvatarImgError={profile.setAvatarImgError}
      />

      {/* Stats */}
      <StatCardGrid stats={stats} loading={statsLoading} />

      {/* Email tool */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <EmailComposer
            jobDescription={composer.jobDescription}
            wordCount={composer.wordCount}
            charCount={composer.charCount}
            handleJobDescriptionChange={composer.handleJobDescriptionChange}
            handleClearJobDescription={composer.handleClearJobDescription}
            handleGenerateMail={composer.handleGenerateMail}
          />
        </div>
        <div className="lg:col-span-3">
          <GeneratedEmailPanel
            emailHtml={composer.emailHtml}
            subject={composer.subject}
            to={composer.to}
            cc={composer.cc}
            bcc={composer.bcc}
            attachments={composer.attachments}
            isDragging={composer.isDragging}
            isSending={composer.isSending}
            isGenerating={composer.isGenerating}
            handleSubjectChange={composer.handleSubjectChange}
            handleToChange={composer.handleToChange}
            handleCcChange={composer.handleCcChange}
            handleBccChange={composer.handleBccChange}
            handleEmailHtmlChange={composer.handleEmailHtmlChange}
            handleGenerateMail={composer.handleGenerateMail}
            handleCopy={composer.handleCopy}
            handleSendEmail={composer.handleSendEmail}
            handleAddFiles={composer.handleAddFiles}
            handleRemoveAttachment={composer.handleRemoveAttachment}
            handleDragEnter={composer.handleDragEnter}
            handleDragLeave={composer.handleDragLeave}
            handleDrop={composer.handleDrop}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivityPanel
        recentApps={recentApps}
        loading={recentLoading}
        activitySummary={activitySummary}
      />
    </div>
  );
};

export default Dashboard;
