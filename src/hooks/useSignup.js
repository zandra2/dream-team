import { useState, useEffect } from "react";
import {
  projectAuth,
  projectStorage,
  projectFirestore,
} from "../firebase/config";
import { useAuthContext } from "./useAuthContext";

export const useSignup = () => {
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const { dispatch } = useAuthContext();

  //the order here must match up with the order arguement for the Signup.js
  const signup = async (email, password, displayName, thumbnail) => {
    setError(null);
    setIsPending(true);

    try {
      // signup
      const res = await projectAuth.createUserWithEmailAndPassword(
        email,
        password
      );

      if (!res) {
        throw new Error("Could not complete signup");
      }

      // upload user thumbnail
      // create upload path where to store image
      const uploadPath = `thumbnails/${res.user.uid}/${thumbnail.name}`;
      // upload the image
      const img = await projectStorage.ref(uploadPath).put(thumbnail);
      // get a url reference to where the image is stored
      const imgUrl = await img.ref.getDownloadURL();

      // add display AND PHOTO_URL name to user
      await res.user.updateProfile({ displayName, photoURL: imgUrl });

      // create a user document with 3 properties to use later on to identify their status as online or offline.
      // add() method will generate an id from firebase
      // doc() method needs a reference of the id in which the res has and user.uid will create the user id.
      // set() method to update the property by adding data to it.
      await projectFirestore.collection("users").doc(res.user.uid).set({
        online: true, // when user sign in
        displayName,
        photoURL: imgUrl,
      });

      // dispatch login action
      dispatch({ type: "LOGIN", payload: res.user });

      if (!isCancelled) {
        setIsPending(false);
        setError(null);
      }
    } catch (err) {
      if (!isCancelled) {
        setError(err.message);
        setIsPending(false);
      }
    }
  };

  useEffect(() => {
    return () => setIsCancelled(true);
  }, []);

  return { signup, error, isPending };
};
