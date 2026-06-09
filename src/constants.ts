/**
 * PDF layout and rendering dimensions
 */
export const A4_WIDTH_PTS = 595.28;
export const A4_HEIGHT_PTS = 841.89;
export const A4_WIDTH_PX = 794;

export const TEXT_MARGIN_PTS = 40;
export const TEXT_LINE_HEIGHT_PTS = 14;
export const TEXT_FONT_SIZE_PTS = 10;

export const IMAGE_MARGIN_PTS = 30;

export const DOCX_HTML_SCALE = 2;
export const DOCX_CONTAINER_PADDING_PX = 40;

/**
 * File dropzone configurations
 */
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.heic'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/plain': ['.txt', '.csv', '.md', '.json', '.xml', '.log']
};

export const SUPPORTED_MIME_PREFIX_REGEX = /^(image|application\/pdf|application\/vnd\.openxmlformats-officedocument|application\/vnd\.ms-excel|text\/)/;
export const SUPPORTED_EXTENSIONS_REGEX = /\.(docx|xlsx|xls|txt|csv|md|json|log|xml)$/i;
