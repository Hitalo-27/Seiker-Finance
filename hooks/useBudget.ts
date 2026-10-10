import { useState, useEffect } from 'react';
import { auth, db } from '../FirebaseConfig';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { Category, MonthlyBudget, RepeatMode } from '../types/budget';

export function useBudget(selectedMonthId: string) {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setBudget(null);

    const budgetRef = doc(db, "users", user.uid, "monthlyBudgets", selectedMonthId);

    const unsubscribe = onSnapshot(budgetRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let currentCategories = data.categories || [];
        
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          const userData = userSnap.data();
          const templateCategories = userData?.categoryTemplate || [];
          
          let hasMissing = false;
          const updatedCategories = [...currentCategories];
          
          templateCategories.forEach((templateItem: Category) => {
            const exists = currentCategories.some((c: Category) => {
              if (c.id === templateItem.id) return true;
              const name1 = (c.name || "").trim().toLowerCase();
              const name2 = (templateItem.name || "").trim().toLowerCase();
              return name1 === name2 && name1 !== "";
            });

            if (!exists) {
              updatedCategories.push({ 
                ...templateItem, 
                name: (templateItem.name || "").trim(),
                value: 0 
              });
              hasMissing = true;
            }
          });
          
          if (hasMissing) {
            await setDoc(budgetRef, { categories: updatedCategories }, { merge: true });
            currentCategories = updatedCategories;
          }
        } catch (error) {
          console.error("Erro ao sincronizar template:", error);
        }

        setBudget({ categories: currentCategories });
        setLoading(false);
      } else {
        await initializeMonth(user.uid, selectedMonthId);
      }
    });

    return () => unsubscribe();
  }, [selectedMonthId]);

  const initializeMonth = async (uid: string, monthId: string) => {
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      const userData = userSnap.data();
      const categoriesToUse = userData?.categoryTemplate || [];

      const docRef = doc(db, "users", uid, "monthlyBudgets", monthId);
      await setDoc(docRef, { categories: categoriesToUse });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const saveTransaction = async (
    editItem: Category,
    repeatMode: RepeatMode,
    newMonths: number,
    isNewCategory: boolean
  ) => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSaving(true);

    try {
      const oldMonths = editItem.totalMonths || 1;
      const groupId = editItem.groupId || Date.now().toString();
      const valuePerMonth =
        repeatMode === "split" ? editItem.value / newMonths : editItem.value;

      for (let i = 0; i < newMonths; i++) {
        const [y, m] = selectedMonthId.split("-").map(Number);
        const date = new Date(y, m - 1 + i, 1);
        const targetMonthId = date.toISOString().slice(0, 7);
        const targetRef = doc(db, "users", user.uid, "monthlyBudgets", targetMonthId);
        const docSnap = await getDoc(targetRef);

        const categoryData = {
          ...editItem,
          value: valuePerMonth,
          id: isNewCategory && i === 0 ? groupId : editItem.id || groupId,
          groupId: groupId,
          totalMonths: newMonths,
          repeatMode: repeatMode,
          installmentLabel:
            newMonths > 1
              ? repeatMode === "split"
                ? `${i + 1}/${newMonths}`
                : "Fixo"
              : null,
        };
        delete categoryData.installments;

        const data = docSnap.exists() ? docSnap.data() : { categories: [] };
        let cats = [...(data.categories || [])];
        const existsIndex = cats.findIndex(
          (c: Category) =>
            c.id === categoryData.id ||
            (c.groupId === groupId &&
              c.installmentLabel === categoryData.installmentLabel)
        );

        if (existsIndex > -1) {
          cats[existsIndex] = categoryData;
        } else {
          cats.push(categoryData);
        }
        await setDoc(targetRef, { categories: cats }, { merge: true });
      }

      if (!isNewCategory && newMonths < oldMonths) {
        for (let i = newMonths; i < oldMonths; i++) {
          const [y, m] = selectedMonthId.split("-").map(Number);
          const date = new Date(y, m - 1 + i, 1);
          const targetMonthId = date.toISOString().slice(0, 7);
          const targetRef = doc(db, "users", user.uid, "monthlyBudgets", targetMonthId);
          const docSnap = await getDoc(targetRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const updatedCats = data.categories.filter(
              (c: Category) => c.groupId !== groupId
            );
            await setDoc(targetRef, { categories: updatedCats }, { merge: true });
          }
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTransaction = async (item: Category) => {
    const user = auth.currentUser;
    if (!user || !budget) return;
    try {
      const ref = doc(db, "users", user.uid, "monthlyBudgets", selectedMonthId);
      const updated = budget.categories.filter((c) => c.id !== item.id);
      await setDoc(ref, { categories: updated }, { merge: true });
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return { budget, loading, isSaving, saveTransaction, deleteTransaction };
}
