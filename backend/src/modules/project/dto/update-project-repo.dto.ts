export class UpdateProjectRepoDto {
  repoUrl?: string;
  repoProvider?: string; // gitlab | gitea | generic
  repoDefaultBranch?: string;
  gitSyncEnabled?: boolean;
  rotateWebhookSecret?: boolean;
}


