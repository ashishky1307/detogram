import { INewPost, INewUser } from "@/types";
import { appwriteConfig, avatars, databases as appwriteDatabases, storage } from "./config";
import { Client, Databases, Storage, ID, Query, Account, ImageGravity } from 'appwrite';
import { IUpdatePost, IUpdateUser } from "@/types";


// Initialize the Appwrite client and services
const client = new Client()
    .setEndpoint(appwriteConfig.url)
    .setProject(appwriteConfig.projectID);

const account = new Account(client);
const databases = new Databases(client);

// ============================== CREATE USER ACCOUNT
export async function createUserAccount(user: INewUser) {
  try {
    // Validate input
    if (!user.email || !user.password || !user.name) {
      throw new Error("Email, password, and name are required.");
    }

    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw new Error("Failed to create a new account.");

    const avatarUrl = avatars.getInitials(user.name);

    // Save user to the database
    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: new URL(avatarUrl.toString()),
    });

    return newUser;
  } catch (error) {
    console.error("Error creating user account:", error);
    throw error;
  }
}


//=====================================   save to database


export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  username?: string;
}) {
  try {
    // Validate required fields
    if (!user.accountId || !user.email || !user.name || !user.imageUrl) {
      throw new Error("Missing required fields for saving user to DB.");
    }

    // Sanitize accountId to meet Appwrite's requirements
    let sanitizedAccountId = user.accountId
      .replace(/[^a-zA-Z0-9\-_.]/g, '') // Remove invalid characters
      .slice(0, 36); // Limit to 36 characters

    // Ensure the ID starts with a letter or number
    if (!/^[a-zA-Z0-9]/.test(sanitizedAccountId)) {
      sanitizedAccountId = 'u' + sanitizedAccountId.slice(0, 35); // Add 'u' prefix if needed
    }

    const newUser = await databases.createDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      ID.unique(),
      {
        userID: user.accountId,
        email: user.email,
        name: user.name,
        username: user.username,
        imageurl: user.imageUrl.toString(),
        bio: "", // Add default empty bio
        posts: [], // Add default empty posts array
        liked: [], // Add default empty liked array
        save: [], // Add default empty save array
      }
    );

    console.log("User saved to DB:", newUser);
    return newUser;
  } catch (error) {
    console.error("Error saving user to DB:", error);
    throw error;
  }
}


// ============================== SIGN IN
export async function SignInAccount(user: { email: string; password: string }) {
  try {
    // Check for existing sessions and delete if exists
    try {
      await account.deleteSession('current');
    } catch (error) {
      // Ignore error if no session exists
    }

    // Create a new session with email/password
    const session = await account.createEmailPasswordSession(
      user.email,
      user.password
    );
    
    if (!session) throw new Error("Failed to create session");
    
    return session;
  } catch (error) {
    console.error("Sign-In Error:", error);
    throw error; // Re-throw to handle in the UI
  }
}





// ============================== GET CURRENT USER
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      [Query.equal("userID", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ============================== GET ACCOUNT
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    console.log(error);
  }
}



// ============================== SIGN OUT
export async function SignOutAccount () {
  try {
    const session = await account.deleteSession("current");
    return session;
    
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// ============================== CREATE POST
export async function createPost(post: INewPost) {
  let uploadedFile: any = null;
  
  try {
    // Validate file input
    if (!post.file || post.file.length === 0) {
      throw new Error("No file provided");
    }

    // Upload the file
    uploadedFile = await uploadFile(post.file[0]);
    if (!uploadedFile) throw new Error("File upload failed");

    // Generate file preview URL
    const fileUrl = await getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw new Error("File preview generation failed");
    }

    console.log("File URL before saving:", fileUrl);

    // Clean up and parse tags
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    // Create post with correct field names matching schema
    const newPost = await databases.createDocument(
      appwriteConfig.databaseID,
      appwriteConfig.postCollectionID,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        ImageURL: fileUrl.toString(),  // This is correct
        imageID: uploadedFile.$id,
        location: post.location,
        tags: tags,
      }
    );

    console.log("Created post:", newPost);
    return newPost;

  } catch (error) {
    // Cleanup on error
    if (uploadedFile) {
      try {
        await deleteFile(uploadedFile.$id);
      } catch (cleanupError) {
        console.error("Error deleting file during cleanup:", cleanupError);
      }
    }
    console.error("Error creating post:", error);
    throw error;
  }
}

// ============================== FILE HANDLERS
export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(appwriteConfig.storageID, ID.unique(), file);
    return uploadedFile;
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

export async function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageID,
      fileId,
      2000,
      2000,
      ImageGravity.Center,
      100
    );
    
    console.log("Generated preview URL:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error("Error getting file preview:", error);
    return null;
  }
}

export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageID, fileId);
    return { status: "ok" };
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}











// ============================== GET POSTS
export async function searchPosts
    (searchTerm: string) {
  try {
    const posts = await databases.
      listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.postCollectionID,
      [Query.search("caption", searchTerm)]
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ 
  pageParam }: { pageParam: number }) {
    const queries: any[] = [Query.orderDesc
  ("$updatedAt"), Query.limit(9)];
  
    if (pageParam) {
      queries.push(Query.cursorAfter
  (pageParam.toString()));
    }
  
    try {
      const posts = await databases.
  listDocuments(
        appwriteConfig.databaseID,
        appwriteConfig.postCollectionID,
        queries
      );
  
      if (!posts) throw Error;
  
      return posts;
    } catch (error) {
      console.log(error);
    }
  }


  // ============================== GET POST BY ID
export async function getPostById(postId?: string) {
  if (!postId) throw Error;

  try {
    const post = await databases.
getDocument(
      appwriteConfig.databaseID,
      appwriteConfig.postCollectionID,
      postId
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UPDATE POST
export async function updatePost(post: 
IUpdatePost) {
  const hasFileToUpdate = post.file.
length > 0;

  try {
    let image = {
      imageUrl: new URL(post.imageUrl),
      imageID: post.imageID,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite 
     storage
      const uploadedFile = await 
      uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = await getFilePreview
         (uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.
        $id);
        throw Error;
      }

      image = { 
        ...image, 
        imageUrl: new URL(fileUrl),
        imageID: uploadedFile.$id 
      };
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    //  Update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseID,
      appwriteConfig.postCollectionID,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageID,
        location: post.location,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedPost) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageID);
      }

      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageID);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== DELETE POST
export async function deletePost(postId?: 
string, imageId?: string) {
  if (!postId || !imageId) return;

  try {
    const statusCode = await databases.
deleteDocument(
      appwriteConfig.databaseID,
      appwriteConfig.postCollectionID,
      postId
    );

    if (!statusCode) throw Error;

    await deleteFile(imageId);

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== LIKE / UNLIKE POST
export async function likePost(postId: 
string, likesArray: string[]) {
  try {
    const updatedPost = await databases.
updateDocument(
      appwriteConfig.databaseID,
      appwriteConfig.postCollectionID,
      postId,
      {
        likes: likesArray,
      }
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== SAVE POST
export async function savePost(userId: 
string, postId: string) {
  try {
    const updatedPost = await databases.
createDocument(
      appwriteConfig.databaseID,
      appwriteConfig.savesCollectionID,
      ID.unique(),
      {
        user: userId,
        post: postId,
      }
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== DELETE SAVED POST
export async function deleteSavedPost
(savedRecordId: string) {
  try {
    const statusCode = await databases.
deleteDocument(
      appwriteConfig.databaseID,
      appwriteConfig.savesCollectionID,
      savedRecordId
    );

    if (!statusCode) throw Error;

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER'S POST
export async function getUserPosts(userId?
: string) {
  if (!userId) return;

  try {
    const post = await databases.
listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.postCollectionID,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET POPULAR POSTS (BY HIGHEST LIKE COUNT)
export async function getRecentPosts() {
  try {
    const posts = await databases.
listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.postCollectionID,
      [Query.orderDesc("$createdAt"), 
Query.limit(20)]
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// USER
// ============================================================

// ============================== GET USERS
export async function getUsers(limit?: 
number) {
  const queries: any[] = [Query.orderDesc
("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  try {
    const users = await databases.
listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      queries
    );

    if (!users) throw Error;

    return users;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER BY ID
export async function getUserById(userId: 
string) {
  try {
    const user = await databases.
getDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      userId
    );

    if (!user) throw Error;

    return user;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UPDATE USER
export async function updateUser(user: 
IUpdateUser) {
  const hasFileToUpdate = user.file.
length > 0;
  try {
    let image = {
      imageUrl: user.imageUrl,
      imageID: user.imageID,
    };

    if (hasFileToUpdate) {
      const uploadedFile = await uploadFile(user.file[0]);
      if (!uploadedFile) throw Error;

      const fileUrl = await getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { 
        ...image, 
        imageUrl: fileUrl, 
        imageID: uploadedFile.$id
      };
    }

    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      user.userId,
      {
        name: user.name,
        bio: user.bio,
        imageUrl: image.imageUrl,
        imageID: image.imageID,
      }
    );

    if (!updatedUser) {
      if (hasFileToUpdate) {
        await deleteFile(image.imageID);
      }
      throw Error;
    }

    if (user.imageID && hasFileToUpdate) {
      await deleteFile(user.imageID);
    }

    return updatedUser;
  } catch (error) {
    console.log(error);
  }
}






