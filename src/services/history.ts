
/**
 * БЕЗОПАСНАЯ ВЕРСИЯ SUPABASE SERVICE
 * Мы не храним ключи в этом файле, так как он попадает в браузер.
 * Вместо этого мы отправляем данные на наш сервер, который уже имеет доступ к Supabase.
 */

export async function saveTestResult(userName: string, totalScore: string, correctAnswersCount: number) {
  try {
    const response = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: userName,
        score: totalScore,
        correct_answers: correctAnswersCount,
        moduleId: 'manual-save', // Для совместимости с текущей логикой
        date: new Date().toISOString()
      })
    });

    if (response.ok) {
      console.log("✅ Результат успешно сохранен через серверный мост!");
      return true;
    } else {
      const err = await response.json();
      console.error("❌ Ошибка сервера при сохранении:", err);
      return false;
    }
  } catch (error) {
    console.error("❌ Ошибка сети при сохранении результата: ", error);
    return false;
  }
}
