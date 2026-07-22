import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { DeleteConfirmation } from "@/screens";
import { router } from "expo-router";

const DeleteConfirmationPage = () => {
  const handleCancel = () => {
    router.back();
  };
  const handleDeleteEverything = () => {
    router.navigate("/done")
  };
  return <DeleteConfirmation onDelete={handleDeleteEverything} onCancel={handleCancel} />;
};

export default DeleteConfirmationPage;
