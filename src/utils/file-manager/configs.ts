enum EFileTypes {
  IMAGE = 'image'
}

const FileExtensions = {
  image: ['jpeg', 'jpg', 'png']
};

enum EFileACL {
  PUBLIC_READ = 'public-read',
  PRIVATE = 'private'
}

export { EFileTypes, FileExtensions, EFileACL };
