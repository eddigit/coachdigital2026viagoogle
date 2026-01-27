import { z } from "zod";

// ============================================================================
// USERS & AUTH
// ============================================================================

export interface User {
    id: number;
    openId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    loginMethod: string | null;
    role: "user" | "admin";
    createdAt: Date;
    updatedAt: Date;
    lastSignedIn: Date;
}

export type InsertUser = Partial<User>;

// ============================================================================
// CLIENT USERS
// ============================================================================

export interface ClientUser {
    id: number;
    clientId: number;
    email: string;
    passwordHash: string;
    isActive: boolean;
    lastLogin: Date | null;
    invitationToken: string | null;
    invitationSentAt: Date | null;
    passwordResetToken: string | null;
    passwordResetExpires: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertClientUser = Partial<ClientUser>;

// ============================================================================
// COMPANY
// ============================================================================

export interface Company {
    id: number;
    name: string;
    legalName: string | null;
    siret: string | null;
    tvaNumber: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logoUrl: string | null;
    appLogo: string | null;
    bankName: string | null;
    iban: string | null;
    bic: string | null;
    defaultTvaRate: string | number;
    defaultPaymentTerms: number;
    legalMentions: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertCompany = Partial<Company>;

// ============================================================================
// CLIENTS
// ============================================================================

export interface Client {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    position: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    category: "prospect" | "active" | "vip" | "inactive";
    status: "active" | "inactive";
    notes: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertClient = Partial<Client>;

// ============================================================================
// PROJECTS
// ============================================================================

export interface Project {
    id: number;
    clientId: number;
    name: string;
    description: string | null;
    type: "website" | "app" | "coaching" | "ia_integration" | "optimization" | "other";
    status: "draft" | "active" | "on_hold" | "completed" | "cancelled";
    priority: "low" | "normal" | "high" | "urgent" | null;
    startDate: Date | null;
    endDate: Date | null;
    estimatedHours: string | number | null;
    budgetEstimate: string | number | null;
    clientBudget: string | number | null;
    projectCost: string | number | null;
    progressPercentage: number | null;
    notes: string | null;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertProject = Partial<Project>;

// ============================================================================
// TASKS
// ============================================================================

export interface Task {
    id: number;
    projectId: number | null;
    clientId: number | null;
    title: string;
    description: string | null;
    status: "todo" | "in_progress" | "review" | "done" | "cancelled";
    priority: "low" | "normal" | "high" | "urgent" | null;
    dueDate: Date | null;
    period: "all_day" | "morning" | "afternoon" | "evening" | null;
    completedAt: Date | null;
    estimatedHours: string | number | null;
    isBillable: boolean | null;
    hourlyRate: string | number | null;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertTask = Partial<Task>;

// ============================================================================
// DOCUMENTS
// ============================================================================

export interface Document {
    id: number;
    clientId: number;
    projectId: number | null;
    type: "quote" | "invoice" | "credit_note";
    number: string;
    status: "draft" | "sent" | "accepted" | "rejected" | "paid" | "cancelled";
    date: Date;
    dueDate: Date | null;
    validityDate: Date | null;
    subject: string | null;
    introduction: string | null;
    conclusion: string | null;
    notes: string | null;
    totalHt: string | number;
    totalTva: string | number;
    totalTtc: string | number;
    discountAmount: string | number | null;
    paymentTerms: number | null;
    paymentMethod: "bank_transfer" | "check" | "card" | "cash" | "other" | null;
    isAcompteRequired: boolean | null;
    acomptePercentage: string | number | null;
    acompteAmount: string | number | null;
    pdfUrl: string | null;
    stripePaymentIntentId: string | null;
    stripeCheckoutSessionId: string | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertDocument = Partial<Document>;
export type ClientDocument = Document;

export interface DocumentLine {
    id: number;
    documentId: number;
    description: string;
    quantity: string | number | null;
    unit: string | null;
    unitPriceHt: string | number;
    tvaRate: string | number;
    totalHt: string | number;
    totalTva: string | number;
    totalTtc: string | number;
    sortOrder: number | null;
    createdAt: Date;
}

export type InsertDocumentLine = Partial<DocumentLine>;

// ============================================================================
// TIME ENTRIES
// ============================================================================

export interface TimeEntry {
    id: number;
    userId: number;
    taskId: number | string | null;
    projectId: number | null;
    clientId: number | null;
    title: string;
    description: string | null;
    date: string | Date;
    period: "morning" | "afternoon" | "evening";
    type: "billable" | "non_billable";
    startTime: Date | null;
    endTime: Date | null;
    duration: number | null;
    hourlyRate: string | number | null;
    priority: number | null;
    status: "planned" | "in_progress" | "completed" | "archived" | null;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertTimeEntry = Partial<TimeEntry>;

// ============================================================================
// LEADS
// ============================================================================

export interface Lead {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    position: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    status: "suspect" | "prospect" | "analyse" | "negociation" | "conclusion" | "ordre";
    potentialAmount: string | number | null;
    probability: number | null;
    source: string | null;
    notes: string | null;
    lastContactDate: string | Date | null;
    nextFollowUpDate: string | Date | null;
    avatarUrl: string | null;
    score: number;
    audience: string | null;
    isActivated: boolean;
    activatedAt: Date | null;
    convertedToClientId: number | string | null;
    convertedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertLead = Partial<Lead>;

// ============================================================================
// EMAIL TEMPLATES & CAMPAIGNS
// ============================================================================

export interface EmailTemplate {
    id: number;
    name: string;
    subject: string;
    body: string;
    bodyJson: any; // json
    category: "voeux" | "presentation" | "relance" | "rendez_vous" | "suivi" | "remerciement" | "autre";
    previewHtml: string | null;
    variables: any;
    isActive: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmailCampaign {
    id: number;
    name: string;
    templateId: number | string | null;
    subject: string;
    body: string;
    status: "draft" | "sending" | "completed" | "paused";
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    createdBy: number;
    createdAt: Date;
    completedAt: Date | null;
}

export interface EmailQueueItem {
    id: number;
    campaignId: number | string;
    leadId: number;
    subject: string;
    body: string;
    status: "pending" | "sending" | "sent" | "failed";
    errorMessage: string | null;
    scheduledAt: Date;
    sentAt: Date | null;
    createdAt: Date;
}

export interface EmailTracking {
    id: number;
    emailQueueId: number | string;
    leadId: number;
    trackingId: string;
    opened: boolean;
    openedAt: Date | null;
    openCount: number;
    clicked: boolean;
    clickedAt: Date | null;
    clickCount: number;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: Date;
}

export interface EmailBlacklist {
    id: number;
    email: string;
    reason: string | null;
    unsubscribedAt: Date;
    createdAt: Date;
}

export interface LeadEmail {
    id: number;
    leadId: number;
    templateId: number | string | null;
    subject: string;
    body: string;
    sentAt: Date;
    sentBy: number | string;
    status: "sent" | "failed" | "opened" | "replied";
}

// ============================================================================
// REVIEWS
// ============================================================================

export interface Review {
    id: number;
    clientId: number;
    projectId: number | null;
    rating: number;
    comment: string | null;
    isPublic: boolean;
    response: string | null;
    respondedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertReview = Partial<Review>;

// ============================================================================
// OTHER ENTITIES
// ============================================================================

export interface ClientRequest {
    id: number;
    clientId: number;
    requestType: "coaching" | "website" | "app" | "ia_integration" | "optimization" | "other";
    title: string;
    description: string;
    budget: string | number | null;
    deadline: string | Date | null;
    priority: "low" | "medium" | "high" | "urgent";
    status: "pending" | "in_review" | "accepted" | "in_progress" | "completed" | "rejected";
    adminNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    clientId: number | null;
    projectId: number | null;
    taskId: number | string | null;
    color: "yellow" | "blue" | "green" | "red" | "purple" | "orange" | null;
    pinned: boolean;
    isClientVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectCredential {
    id: number;
    projectId: number;
    category: "hosting" | "api" | "smtp" | "domain" | "cms" | "database" | "other";
    label: string;
    description: string | null;
    encryptedData: string;
    url: string | null;
    expiresAt: Date | null;
    notes: string | null;
    sharedBy: number | string | null;
    sharedAt: Date | null;
    lastAccessedBy: number | string | null;
    lastAccessedAt: Date | null;
    accessCount: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CredentialAccessLog {
    id: number;
    credentialId: number | string;
    accessedBy: number | string;
    accessType: "view" | "edit" | "delete";
    ipAddress: string | null;
    userAgent: string | null;
    accessedAt: Date;
}

export interface CalendarEvent {
    id: number;
    clientId: number | null;
    projectId: number | null;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    allDay: boolean;
    type: "meeting" | "call" | "deadline" | "reminder" | "event" | "other";
    location: string | null;
    createdById: number;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertCalendarEvent = Partial<CalendarEvent>;

export interface Message {
    id: number;
    senderId: number;
    senderType: "admin" | "client";
    recipientId: number;
    recipientType: "admin" | "client";
    content: string;
    subject: string | null;
    clientId: number | null;
    projectId: number | null;
    attachmentUrl: string | null;
    attachmentName: string | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
}

export type InsertMessage = Partial<Message>;

export interface ProjectNote {
    id: number;
    projectId: number;
    title: string;
    content: string;
    tags: string | null;
    isPinned: boolean;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertProjectNote = Partial<ProjectNote>;

export interface ProjectRequirement {
    id: number;
    projectId: number;
    title: string;
    description: string | null;
    objectives: string | null;
    scope: string | null;
    constraints: string | null;
    deliverables: string | null;
    timeline: string | null;
    budget: string | null;
    status: "draft" | "pending" | "review" | "approved" | "rejected" | "archived";
    version: number;
    createdAt: Date;
    updatedAt: Date;
    approvedAt: Date | null;
    approvedBy: number | string | null;
}

export type InsertProjectRequirement = Partial<ProjectRequirement>;

export interface Audience {
    id: number;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}


export interface ProjectVariable {
    id: number;
    projectId: number;
    name: string;
    value: string;
    type: string;
    description: string | null;
    isSecret: boolean;
}
export type InsertProjectVariable = Partial<ProjectVariable>;

export interface Notification {
    id: number;
    userId: number;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    isRead: boolean;
    createdAt: Date;
    link: string | null;
}
export type InsertNotification = Partial<Notification>;

export interface DocumentTemplate {
    id: number;
    userId: number;
    type: "quote" | "invoice";
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    companyName: string | null;
    companyAddress: string | null;
    companyPhone: string | null;
    companyEmail: string | null;
    companySiret: string | null;
    companyTva: string | null;
    legalMentions: string | null;
    termsAndConditions: string | null;
    footerText: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentView {
    id: number;
    documentId: number;
    trackingId: number;
    ipAddress: string | null;
    userAgent: string | null;
    viewedAt: Date;
}
export type InsertDocumentView = Partial<DocumentView>;

export interface DocumentSignature {
    id: number;
    documentId: number;
    signatureToken: string;
    signerName: string;
    signerEmail: string;
    signerRole: "client" | "coach";
    expiresAt: Date | null;
    status: "pending" | "signed" | "declined";
    declinedReason: string | null;
    signatureData: string | null;
    signedAt: Date | null;
    signedIp: string | null;
    signedUserAgent: string | null;
    reminderSentAt: Date | null;
    reminderCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectSecret {
    id: number;
    projectId: number;
    category: "database" | "hosting" | "smtp" | "api" | "ftp" | "other";
    name: string;
    value: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export type InsertProjectSecret = Partial<ProjectSecret>;

export interface DocumentTracking {
    id: number;
    documentId: number;
    trackingToken: string;
    viewCount: number;
    firstViewedAt: Date | null;
    lastViewedAt: Date | null;
    viewerIp: string | null;
    viewerUserAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export type InsertDocumentTracking = Partial<DocumentTracking>;
