import React, { createContext, useContext, useState } from "react";

type AlertType = "success" | "error" | "info";

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
}

interface AlertContextData {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  alertConfig: AlertOptions & { visible: boolean };
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (options: AlertOptions) => {
    setAlertConfig({ 
      ...options, 
      visible: true, 
      type: options.type || "info" 
    });
  };

  const hideAlert = () => {
    if (alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
    
    setAlertConfig((prev) => ({ 
      ...prev, 
      visible: false, 
      onConfirm: undefined
    }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, alertConfig }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);