import { INewUser } from "@/types";
import { account, appwriteConfig, avatars, database } from "./config";
import { Client, Databases, ID, Query } from "appwrite";

export async function createUserAccount(user: INewUser){

    try{
        const newAccount= await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        );
        
        if(!newAccount) throw Error;

        const avatarsUrl=avatars.getInitials(user.name);

        const newUser=await savesUserToDB({
            accountId: newAccount.$id,
            name:newAccount.name,
            email: newAccount.email,
            username: user.username,
            imageUrls: avatarsUrl,

        })
        return newUser;
    } catch(error){
        console.log(error);
        return error;
    }

}

export async function savesUserToDB(user:{
    accountId: string,
    email: string,
    name: string,
    imageUrls: string,
    username?: string
}){
    try{
        const client = new Client();
        const databases = new Databases(client);
        const newUser = await databases.createDocument(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            ID.unique(),
            user,
        );

        return newUser;
    }catch(error){
        console.log(error);
        
    }
}

export async function SignInAccount(user: {email: string; password: string}){
    try{
        const session=await account.createSession(user.email, user.password);

        return session;

    }catch(error){
        console.log(error);
    }
}

export async function getCurrentUser() {
    try {
        console.log("Fetching current account...");
        const currentaccount = await account.get();
        console.log("Current account:", currentaccount);

        if (!currentaccount) throw new Error("No current account found");

        console.log("Fetching user document...");
        const currentUser = await database.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            [Query.equal("accountId", currentaccount.$id)]
        );
        console.log("User document:", currentUser);

        if (!currentUser.documents.length) {
            throw new Error("User document not found");
        }

        return currentUser.documents[0];
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching current user:", error.message);
        } else {
            console.error("Error fetching current user:", error);
        }
        return null;
    }
}




export async function SignOutAccount() {
  try {
    console.log('SignOutAccount function called'); // Add this line for debugging
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    console.error('Error signing out user:', error);
    throw error;
  }
}












