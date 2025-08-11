// Enhanced types to eliminate 'any' usage and improve type safety

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface PaginatedResponse<T = any> {
  results: T[];
  start: number;
  limit: number;
  size: number;
  totalSize?: number;
}

export interface ConfluenceApiUser {
  accountId: string;
  accountType: string;
  email?: string;
  publicName: string;
  profilePicture?: {
    path: string;
    width: number;
    height: number;
    isDefault: boolean;
  };
  displayName: string;
  _expandable?: Record<string, string>;
  _links?: {
    base: string;
    context: string;
    self: string;
  };
}

export interface ConfluenceApiPage {
  id: string;
  type: 'page' | 'blogpost' | 'attachment';
  title: string;
  space?: {
    id: string;
    key: string;
    name: string;
    type: string;
    _links?: {
      webui: string;
      self: string;
    };
  };
  version?: {
    by: ConfluenceApiUser;
    when: string;
    friendlyWhen: string;
    message: string;
    number: number;
    minorEdit: boolean;
    syncRev: string;
    confRev: string;
  };
  body?: {
    storage?: {
      value: string;
      representation: 'storage';
      embeddedContent?: any[];
    };
    atlas_doc_format?: {
      value: string;
      representation: 'atlas_doc_format';
    };
  };
  history?: {
    latest: boolean;
    createdBy: ConfluenceApiUser;
    createdDate: string;
  };
  children?: {
    attachment?: {
      results: ConfluenceApiAttachment[];
      start: number;
      limit: number;
      size: number;
    };
    comment?: {
      results: ConfluenceApiComment[];
      start: number;
      limit: number;
      size: number;
    };
    page?: {
      results: ConfluenceApiPage[];
      start: number;
      limit: number;
      size: number;
    };
  };
  descendants?: {
    attachment?: {
      results: ConfluenceApiAttachment[];
      start: number;
      limit: number;
      size: number;
    };
    comment?: {
      results: ConfluenceApiComment[];
      start: number;
      limit: number;
      size: number;
    };
    page?: {
      results: ConfluenceApiPage[];
      start: number;
      limit: number;
      size: number;
    };
  };
  container?: any;
  metadata?: {
    labels?: {
      results: ConfluenceApiLabel[];
      start: number;
      limit: number;
      size: number;
    };
    properties?: Record<string, any>;
  };
  operations?: Array<{
    operation: string;
    targetType: string;
  }>;
  restrictions?: {
    read?: {
      results: any[];
      start: number;
      limit: number;
      size: number;
    };
    update?: {
      results: any[];
      start: number;
      limit: number;
      size: number;
    };
  };
  _expandable?: Record<string, string>;
  _links?: {
    webui: string;
    edit: string;
    tinyui: string;
    collection: string;
    base: string;
    context: string;
    self: string;
  };
}

export interface ConfluenceApiAttachment {
  id: string;
  type: 'attachment';
  title: string;
  metadata?: {
    mediaType: string;
    fileSize: number;
    comment?: string;
    properties?: Record<string, any>;
  };
  extensions?: {
    mediaType: string;
    fileSize: number;
    comment: string;
    createdBy: ConfluenceApiUser;
    createdDate: string;
    position?: number;
  };
  _expandable?: Record<string, string>;
  _links?: {
    self: string;
    webui: string;
    edit: string;
    download: string;
    thumbnail?: string;
  };
}

export interface ConfluenceApiComment {
  id: string;
  type: 'comment';
  title: string;
  body?: {
    storage?: {
      value: string;
      representation: 'storage';
    };
  };
  history?: {
    latest: boolean;
    createdBy: ConfluenceApiUser;
    createdDate: string;
  };
  _expandable?: Record<string, string>;
  _links?: {
    webui: string;
    self: string;
  };
}

export interface ConfluenceApiLabel {
  prefix: string;
  name: string;
  id: string;
  label: string;
}

export interface ConfluenceApiSpace {
  id: string;
  key: string;
  name: string;
  type: 'global' | 'personal';
  status: 'current' | 'archived';
  description?: {
    plain?: {
      value: string;
      representation: 'plain';
    };
    view?: {
      value: string;
      representation: 'view';
    };
  };
  homepage?: ConfluenceApiPage;
  metadata?: Record<string, any>;
  operations?: Array<{
    operation: string;
    targetType: string;
  }>;
  permissions?: any[];
  icon?: {
    path: string;
    width: number;
    height: number;
    isDefault: boolean;
  };
  theme?: any;
  history?: {
    createdDate: string;
    createdBy: ConfluenceApiUser;
  };
  _expandable?: Record<string, string>;
  _links?: {
    webui: string;
    context: string;
    self: string;
    collection: string;
    base: string;
  };
}

// Jira Enhanced Types
export interface JiraApiUser {
  self: string;
  accountId: string;
  accountType: string;
  emailAddress?: string;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  displayName: string;
  active: boolean;
  timeZone: string;
  locale?: string;
  groups?: {
    size: number;
    items: any[];
  };
  applicationRoles?: {
    size: number;
    items: any[];
  };
  expand?: string;
}

export interface JiraApiIssue {
  expand?: string;
  id: string;
  self: string;
  key: string;
  fields: {
    summary: string;
    issuetype: {
      self: string;
      id: string;
      description: string;
      iconUrl: string;
      name: string;
      subtask: boolean;
      avatarId?: number;
    };
    project: {
      self: string;
      id: string;
      key: string;
      name: string;
      projectTypeKey: string;
      simplified: boolean;
      avatarUrls: {
        '48x48': string;
        '24x24': string;
        '16x16': string;
        '32x32': string;
      };
    };
    created: string;
    updated: string;
    priority?: {
      self: string;
      iconUrl: string;
      name: string;
      id: string;
    };
    status: {
      self: string;
      description: string;
      iconUrl: string;
      name: string;
      id: string;
      statusCategory: {
        self: string;
        id: number;
        key: string;
        colorName: string;
        name: string;
      };
    };
    creator?: JiraApiUser;
    reporter?: JiraApiUser;
    assignee?: JiraApiUser;
    description?: any; // ADF (Atlassian Document Format) or string
    labels?: string[];
    components?: Array<{
      self: string;
      id: string;
      name: string;
      description?: string;
    }>;
    fixVersions?: Array<{
      self: string;
      id: string;
      name: string;
      description?: string;
      archived: boolean;
      released: boolean;
      releaseDate?: string;
    }>;
    resolution?: {
      self: string;
      id: string;
      description: string;
      name: string;
    };
    resolutiondate?: string;
    workratio?: number;
    lastViewed?: string;
    aggregatetimeoriginalestimate?: number;
    timeoriginalestimate?: number;
    timeestimate?: number;
    aggregatetimeestimate?: number;
    timespent?: number;
    aggregatetimespent?: number;
    comment?: {
      comments: JiraApiComment[];
      maxResults: number;
      total: number;
      startAt: number;
    };
    attachment?: JiraApiAttachment[];
    subtasks?: Array<{
      id: string;
      key: string;
      self: string;
      fields: {
        summary: string;
        status: any;
        priority: any;
        issuetype: any;
      };
    }>;
    issuelinks?: Array<{
      id: string;
      self: string;
      type: {
        id: string;
        name: string;
        inward: string;
        outward: string;
        self: string;
      };
      outwardIssue?: {
        id: string;
        key: string;
        self: string;
        fields: {
          summary: string;
          status: any;
          priority: any;
          issuetype: any;
        };
      };
      inwardIssue?: {
        id: string;
        key: string;
        self: string;
        fields: {
          summary: string;
          status: any;
          priority: any;
          issuetype: any;
        };
      };
    }>;
    parent?: {
      id: string;
      key: string;
      self: string;
      fields: {
        summary: string;
        status: any;
        priority: any;
        issuetype: any;
      };
    };
    worklog?: {
      startAt: number;
      maxResults: number;
      total: number;
      worklogs: JiraApiWorklog[];
    };
    [key: string]: any; // For custom fields
  };
  renderedFields?: Record<string, any>;
  properties?: Record<string, any>;
  names?: Record<string, string>;
  schema?: Record<string, any>;
  transitions?: Array<{
    id: string;
    name: string;
    to: {
      self: string;
      description: string;
      iconUrl: string;
      name: string;
      id: string;
      statusCategory: {
        self: string;
        id: number;
        key: string;
        colorName: string;
        name: string;
      };
    };
    hasScreen: boolean;
    isGlobal: boolean;
    isInitial: boolean;
    isConditional: boolean;
    fields?: Record<string, any>;
  }>;
  changelog?: {
    startAt: number;
    maxResults: number;
    total: number;
    histories: Array<{
      id: string;
      author: JiraApiUser;
      created: string;
      items: Array<{
        field: string;
        fieldtype: string;
        fieldId?: string;
        from?: string;
        fromString?: string;
        to?: string;
        toString?: string;
      }>;
    }>;
  };
  versionedRepresentations?: Record<string, any>;
  fieldsToInclude?: {
    included: string[];
    actuallyIncluded: string[];
    excluded: string[];
  };
}

export interface JiraApiComment {
  self: string;
  id: string;
  author: JiraApiUser;
  body: any; // ADF or string
  updateAuthor: JiraApiUser;
  created: string;
  updated: string;
  visibility?: {
    type: string;
    value: string;
    identifier?: string;
  };
  properties?: any[];
}

export interface JiraApiAttachment {
  self: string;
  id: string;
  filename: string;
  author: JiraApiUser;
  created: string;
  size: number;
  mimeType: string;
  content: string;
  thumbnail?: string;
}

export interface JiraApiWorklog {
  self: string;
  author: JiraApiUser;
  updateAuthor: JiraApiUser;
  comment?: any;
  created: string;
  updated: string;
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
  id: string;
  issueId: string;
  properties?: any[];
}

export interface JiraApiProject {
  self: string;
  id: string;
  key: string;
  name: string;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  projectCategory?: {
    self: string;
    id: string;
    name: string;
    description: string;
  };
  simplified: boolean;
  style: string;
  insight?: {
    totalIssueCount: number;
    lastIssueUpdateTime: string;
  };
  deleted?: boolean;
  retentionTillDate?: string;
  deletedDate?: string;
  deletedBy?: JiraApiUser;
  archived?: boolean;
  archivedDate?: string;
  archivedBy?: JiraApiUser;
  projectTypeKey: string;
  properties?: Record<string, any>;
  uuid: string;
  leadAccountId?: string;
  lead?: JiraApiUser;
  description?: string;
  url?: string;
  email?: string;
  assigneeType?: string;
  versions?: any[];
  components?: any[];
  issueTypes?: any[];
  permissions?: Record<string, any>;
  roles?: Record<string, string>;
  expand?: string;
}

// Error types
export interface ApiError {
  response?: {
    status: number;
    statusText: string;
    data?: any;
  };
  message: string;
  code?: string;
  isAxiosError?: boolean;
}

// Validation result types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
  sanitizedValue?: any;
}

// Handler response types
export interface HandlerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    requestId?: string;
    timestamp?: string;
    duration?: number;
  };
}
