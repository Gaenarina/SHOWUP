import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { AppUser, UserRole } from "../types/user";

export const registerUser = async ({
  email,
  password,
  name,
  role,
  phone,
  birthDate,
  businessName,
  businessNumber,
  walletAddress,
}: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone: string;
  birthDate: string;
  businessName: string | null;
  businessNumber: string | null;
  walletAddress: string;
}) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email,
    role,
    phone,
    birthDate,
    businessName,
    businessNumber,
    walletAddress,
    noShowCount: 0,
    reputationScore: 100,
    createdAt: serverTimestamp(),
  });

  return user.uid;
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as AppUser;
};
