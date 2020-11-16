interface IWebhook {
  event: string; // delete | new_emails | spam | open | redirect | unsubscribe | task_status_update
  email: string;
  timestamp: string | number;
}

interface IWebhookEmailDelete extends IWebhook {
  book_id: string | number; // 490686
}

interface IWebhookNewEmail extends IWebhook {
  variables: any[];
  source: string; // address book
  book_id: string | number; // 490686
}

interface IWebhookSpamEmail extends IWebhook {
  task_id: string | number;
}

interface IWebhookOpenEmail extends IWebhook {
  task_id: string | number;
  open_device: string; // Desktop
  open_platform: string; // Windows
  browser_ver: string; // 11.0
  browser_name: string; // Firefox
}

interface IWebhookLinkClick extends IWebhook {
  link_url: string;
  task_id: string | number;
  open_device: string;
  open_platform: string;
  browser_ver: string;
  browser_name: string;
  link_id: number;
}

interface IWebhookUnsubscribe extends IWebhook { // Client opted-out
  task_id: string | number;
  from_all: number;
  reason: string | null;
  book_id: string | number;
  categories: string;
}

interface IWebhookTaskStatusUpdate extends IWebhook {
  status: string; // approve | approve_part | only_active | confirm_addresses | need_edit | rejected | on_moderation | sending
  status_explain: string;
  task_id: string | number;
  book_id: string | number;
}

export {
  IWebhook,
  IWebhookEmailDelete,
  IWebhookNewEmail,
  IWebhookSpamEmail,
  IWebhookOpenEmail,
  IWebhookLinkClick,
  IWebhookUnsubscribe,
  IWebhookTaskStatusUpdate
};
