export interface ReadConfluencePageArgs {
  pageId?: string;
  title?: string;
  spaceKey?: string;
  expand?: string;
  format?: 'storage' | 'markdown';
}

export interface SearchConfluencePagesArgs {
  cql: string;
  limit?: number;
  start?: number;
  expand?: string;
}

export interface ListConfluenceSpacesArgs {
  type?: 'global' | 'personal';
  status?: 'current' | 'archived';
  limit?: number;
  start?: number;
}

export interface ListConfluenceAttachmentsArgs {
  pageId: string;
  mediaType?: string;
  filename?: string;
  limit?: number;
  start?: number;
}

export interface DownloadConfluenceAttachmentArgs {
  attachmentId: string;
  version?: number;
}

export interface DownloadConfluencePageCompleteArgs {
  pageId: string;
  includeAttachments?: boolean;
  attachmentTypes?: string[];
  maxAttachmentSize?: number;
}

export interface CreateConfluencePageArgs {
  spaceKey: string;
  title: string;
  content: string;
  parentId?: string;
  type?: 'page' | 'blogpost';
}

export interface UpdateConfluencePageArgs {
  pageId: string;
  title?: string;
  content?: string;
  version: number;
  minorEdit?: boolean;
  versionComment?: string;
}

export interface AddConfluenceCommentArgs {
  pageId: string;
  content: string;
  parentCommentId?: string;
}

export interface FindConfluenceUsersArgs {
  cql?: string;
  username?: string;
  userKey?: string;
  accountId?: string;
  expand?: string;
  limit?: number;
  start?: number;
}

export interface GetConfluenceLabelsArgs {
  pageId: string;
  prefix?: string;
  limit?: number;
  start?: number;
}

export interface AddConfluenceLabelsArgs {
  pageId: string;
  labels: Array<{
    prefix?: string;
    name: string;
  }>;
}

export interface ExportConfluencePageArgs {
  pageId: string;
  format: 'html' | 'markdown';
}

export interface GetConfluenceSpaceArgs {
  spaceKey: string;
  expand?: string;
}

export interface ListConfluencePageChildrenArgs {
  pageId: string;
  limit?: number;
  start?: number;
  expand?: string;
}

export interface ListConfluencePageAncestorsArgs {
  pageId: string;
}

export interface UploadConfluenceAttachmentArgs {
  pageId: string;
  file: string;
  filename: string;
  comment?: string;
  minorEdit?: boolean;
}

export interface GetMyRecentConfluencePagesArgs {
  limit?: number;
  start?: number;
  spaceKey?: string;
}

export interface GetConfluencePagesMentioningMeArgs {
  limit?: number;
  start?: number;
  spaceKey?: string;
}

export interface GetConfluenceUserArgs {
  username?: string;
  accountId?: string;
  email?: string;
}

export interface SearchConfluencePagesByUserArgs {
  username?: string;
  accountId?: string;
  searchType: 'creator' | 'lastModifier' | 'both';
  spaceKey?: string;
  limit?: number;
  start?: number;
}

export interface ListUserConfluencePagesArgs {
  username?: string;
  accountId?: string;
  spaceKey?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  start?: number;
}

export interface ListUserConfluenceAttachmentsArgs {
  username?: string;
  accountId?: string;
  spaceKey?: string;
  limit?: number;
  start?: number;
}

export interface ReadJiraIssueArgs {
  issueKey: string;
  expand?: string;
}

export interface SearchJiraIssuesArgs {
  jql: string;
  maxResults?: number;
  startAt?: number;
  fields?: string;
}

export interface ListJiraProjectsArgs {
  expand?: string;
}

export interface CreateJiraIssueArgs {
  projectKey: string;
  issueType: string;
  summary: string;
  description?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  components?: string[];
  customFields?: Record<string, any>;
}

export interface JiraIssueCreatePayload {
  fields: {
    project: { key: string };
    issuetype: { name: string };
    summary: string;
    description?: {
      type: 'doc';
      version: 1;
      content: any[];
    };
    priority?: { name: string };
    assignee?: { accountId: string };
    labels?: string[];
    components?: { name: string }[];
    [key: string]: any;
  };
}

export interface AddJiraCommentArgs {
  issueKey: string;
  body: string;
  visibility?: {
    type: 'group' | 'role';
    value: string;
  };
}

export interface JiraCommentPayload {
  body: {
    type: 'doc';
    version: 1;
    content: any[];
  };
  visibility?: any;
}

export interface ConfluencePagePayload {
  type: string;
  title: string;
  space: { key: string };
  body: {
    storage: {
      value: string;
      representation: 'storage';
    };
  };
  ancestors?: { id: string }[];
}

export interface ConfluencePageUpdatePayload {
  id: string;
  type: string;
  title: string;
  space: { key: string };
  body: {
    storage: {
      value: string;
      representation: 'storage';
    };
  };
  version: {
    number: number;
    minorEdit: boolean;
    message?: string;
  };
}

export interface ConfluenceCommentPayload {
  type: 'comment';
  container: {
    id: string;
    type: 'page';
  };
  body: {
    storage: {
      value: string;
      representation: 'storage';
    };
  };
  ancestors?: { id: string }[];
}

export interface ListJiraBoardsArgs {
  projectKeyOrId?: string;
  type?: 'scrum' | 'kanban';
  startAt?: number;
  maxResults?: number;
}

export interface ListJiraSprintsArgs {
  boardId: number;
  state?: 'active' | 'closed' | 'future';
  startAt?: number;
  maxResults?: number;
}

export interface GetJiraSprintArgs {
  sprintId: number;
}

export interface GetMyTasksInCurrentSprintArgs {
  boardId?: number;
  projectKey?: string;
}

export interface GetMyOpenIssuesArgs {
  projectKeys?: string[];
  maxResults?: number;
}

export interface GetJiraUserArgs {
  username?: string;
  accountId?: string;
  email?: string;
}

export interface SearchJiraIssuesByUserArgs {
  username?: string;
  accountId?: string;
  searchType: 'assignee' | 'reporter' | 'creator' | 'watcher' | 'all';
  projectKeys?: string[];
  status?: string;
  issueType?: string;
  maxResults?: number;
  startAt?: number;
}

export interface ListUserJiraIssuesArgs {
  username?: string;
  accountId?: string;
  role: 'assignee' | 'reporter' | 'creator';
  projectKeys?: string[];
  startDate?: string;
  endDate?: string;
  maxResults?: number;
  startAt?: number;
}

export interface GetUserJiraActivityArgs {
  username?: string;
  accountId?: string;
  activityType?: 'comments' | 'transitions' | 'all';
  projectKeys?: string[];
  days?: number;
  maxResults?: number;
  startAt?: number;
}

export interface GetUserJiraWorklogArgs {
  username?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  projectKeys?: string[];
  maxResults?: number;
  startAt?: number;
}

export interface ConfluencePage {
  id: string;
  type: string;
  status: string;
  title: string;
  space?: {
    key: string;
    name: string;
  };
  version?: {
    number: number;
  };
  body?: {
    storage?: {
      value: string;
      representation: string;
    };
  };
  _links?: {
    self: string;
    webui: string;
  };
}

export interface ConfluenceSpace {
  id: number;
  key: string;
  name: string;
  type: string;
  status: string;
  description?: {
    plain?: {
      value: string;
    };
  };
  _links?: {
    self: string;
    webui: string;
  };
}

export interface ConfluenceUser {
  type: string;
  accountId: string;
  email?: string;
  publicName: string;
  displayName: string;
  profilePicture?: {
    path: string;
    width: number;
    height: number;
    isDefault: boolean;
  };
  operations?: any[];
  _links?: {
    self: string;
  };
}

export interface ConfluenceAttachment {
  id: string;
  type: string;
  status: string;
  title: string;
  version: {
    number: number;
    minorEdit: boolean;
    hidden: boolean;
  };
  metadata: {
    mediaType: string;
    labels: {
      results: any[];
      size: number;
    };
  };
  extensions: {
    mediaType: string;
    fileSize: number;
    comment?: string;
  };
  _links?: {
    self: string;
    webui: string;
    download: string;
  };
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: Record<string, any>;
  transitions?: Array<{
    id: string;
    name: string;
    to: {
      name: string;
    };
  }>;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey: string;
  lead?: {
    displayName: string;
  };
  issueTypes?: Array<{
    name: string;
    description: string;
  }>;
}

export interface JiraUser {
  self: string;
  accountId: string;
  emailAddress?: string;
  displayName: string;
  active: boolean;
  timeZone?: string;
  accountType?: string;
  avatarUrls?: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
}

export interface JiraBoard {
  id: number;
  self: string;
  name: string;
  type: 'scrum' | 'kanban';
  location?: {
    projectId?: number;
    projectKey?: string;
    projectName?: string;
    projectTypeKey?: string;
  };
}

export interface JiraSprint {
  id: number;
  self: string;
  state: 'active' | 'closed' | 'future';
  name: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  originBoardId?: number;
  goal?: string;
}

export interface AtlassianErrorResponse {
  statusCode?: number;
  message?: string;
  errorMessages?: string[];
  errors?: {
    [key: string]: string;
  };
}

// Response interfaces for better type safety
export interface WorklogEntry {
  issueKey: string;
  summary: string;
  project: string;
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
  comment?: string;
  created: string;
  updated: string;
}

export interface UserJiraWorklogResponse {
  user: string;
  dateRange: {
    start: string;
    end: string;
  };
  totalWorklogs: number;
  totalTimeSpentSeconds: number;
  totalTimeSpentFormatted: string;
  worklogs: WorklogEntry[];
}

export interface UserIssueSearchResponse {
  searchType: string;
  user: string;
  totalIssues: number;
  startAt: number;
  maxResults: number;
  issues: IssueSearchResult[];
}

export interface IssueSearchResult {
  key: string;
  summary: string;
  status?: string;
  priority?: string;
  issueType?: string;
  assignee?: string;
  reporter?: string;
  project?: string;
  resolution?: string;
  created: string;
  updated: string;
  webUrl: string;
}

export interface UserProfileResponse {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  active: boolean;
  timeZone?: string;
  accountType?: string;
  avatarUrls?: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  profileUrl: string;
  source: 'api' | 'cache';
}
