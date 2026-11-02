// dsh-usage-sidebar — browser half.
// Sidebar footer shows balance + usage; settings page shows balance, usage and last 7 days.
// Signed-in DSH accounts get official tokens and cost; signed-out shows balance and local
// session-log tokens only, with a hint that detailed usage needs login.
window.__ModuleLoader__.load({
  id: 'dsh-usage-sidebar',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    const React = require('react')

    const BALANCE_PATH = '/api/dsh-usage-sidebar/balance'
    const STATS_PATH = '/api/dsh-usage-sidebar/stats'
    const CREDENTIAL_PATH = '/api/dsh-usage-sidebar/credential'
    const API_KEY_REF = 'DSH_DEEPSEEK_SPEND_API_KEY'

    const DICT = {
      "en": {
        "todayUsage": "Today {tokens} tok",
        "todayUsageCost": "Today {cost} · {tokens} tok",
        "granted": "Granted",
        "topped": "Topped up",
        "loading": "Loading…",
        "balanceError": "Balance unavailable",
        "usageTitle": "DeepSeek usage",
        "refresh": "Refresh",
        "refreshing": "Refreshing…",
        "last7": "Last 7 days",
        "thisMonth": "This month",
        "cumulative": "All time",
        "balanceUnavailable": "Balance unavailable",
        "localHint": "detailed usage available after login",
        "usageLocalTitle": "Local session logs · tokens only",
        "usageAccountTitle": "Account usage (official)",
        "monthTokens": "Tokens this month",
        "todayTokens": "Tokens today",
        "monthCalls": "Calls this month",
        "updatedAt": "Updated {time}",
        "autoRefresh": "Auto refresh",
        "sourceAccount": "DSH account",
        "notSignedIn": "Not signed in to DSH",
        "settingsTitle": "DeepSeek balance and usage",
        "balanceCard": "Current balance",
        "apiKeyCard": "API key (optional)",
        "apiKeyDesc": "Leave empty to use this machine’s DEEPSEEK_API_KEY. A manual key is stored in DSH credentials.",
        "apiKeyPlaceholder": "sk-… (empty = harness key)",
        "saveAndUse": "Save and use",
        "usingManualKey": "Using a manual key (stored in local credentials)",
        "clearUseHarness": "Clear, use harness key",
        "saved": "Saved",
        "cleared": "Cleared, using harness key",
        "accountOk": "✓ Account available",
        "accountWarn": "⚠ Balance insufficient or unavailable",
        "keySource": "Key source: {source}",
        "keySourceManual": "manual",
        "keySourceHarness": "harness (DEEPSEEK_API_KEY)",
        "readingStats": "Loading statistics…",
        "usageCard": "Usage",
        "daysCard": "Last 7 days",
        "daysLocalNote": "Tokens come from local session logs (local calendar day); cost is not estimated while signed out.",
        "daysAccountNote": "Tokens and cost come from platform.deepseek.com (local calendar day).",
        "noDays": "No data",
        "rejected": "Signed in, but the platform refused account-session usage reads",
        "probeError": "Account session request failed",
        "footerNote": "Balance from GET /user/balance · usage from platform.deepseek.com",
        "todayLabel": "Today",
        "balancePrefix": "Balance: ",
        "todayPrefix": "Today: ",
        "minutesUnit": "min",
        "languageLabel": "Language",
        "languageAuto": "Auto"
      },
      "zh": {
        "todayUsage": "今日 {tokens} token",
        "todayUsageCost": "今日 {cost} · {tokens} token",
        "granted": "赠送",
        "topped": "充值",
        "loading": "读取中…",
        "balanceError": "余额获取失败",
        "usageTitle": "DeepSeek 用量",
        "refresh": "刷新",
        "refreshing": "刷新中…",
        "last7": "近 7 天",
        "thisMonth": "本月",
        "cumulative": "累计",
        "balanceUnavailable": "余额不可用",
        "localHint": "登录后可查看详细用量与费用",
        "usageLocalTitle": "本机会话日志 · 仅 token",
        "usageAccountTitle": "账户用量（官方）",
        "monthTokens": "本月 token",
        "todayTokens": "今日 token",
        "monthCalls": "本月调用次数",
        "updatedAt": "更新于 {time}",
        "autoRefresh": "自动刷新",
        "sourceAccount": "DSH 账户登录",
        "notSignedIn": "未登录 DSH 账户",
        "settingsTitle": "DeepSeek 余额与用量",
        "balanceCard": "当前余额",
        "apiKeyCard": "API Key（可选）",
        "apiKeyDesc": "留空则使用本机已配置的 DEEPSEEK_API_KEY。手动 Key 通过 DSH credentials 保存。",
        "apiKeyPlaceholder": "sk-…（留空使用 harness 配置）",
        "saveAndUse": "保存并使用",
        "usingManualKey": "已使用手动 Key（保存在本机 credentials）",
        "clearUseHarness": "清除，改用 harness Key",
        "saved": "已保存",
        "cleared": "已清除，改用 harness Key",
        "accountOk": "✓ 账户可用",
        "accountWarn": "⚠ 余额不足或不可用",
        "keySource": "Key 来源：{source}",
        "keySourceManual": "手动",
        "keySourceHarness": "harness 配置（DEEPSEEK_API_KEY）",
        "readingStats": "正在获取统计…",
        "usageCard": "用量",
        "daysCard": "近 7 天用量",
        "daysLocalNote": "token 来自本机会话日志（本机时区自然日），未登录不估算花费。",
        "daysAccountNote": "token 与费用来自 platform.deepseek.com 后台统计（本机时区自然日）。",
        "noDays": "暂无数据",
        "rejected": "已登录 DSH，但平台拒绝用账户会话读取用量",
        "probeError": "账户会话请求失败",
        "footerNote": "余额来自官方 GET /user/balance · 用量来自 platform.deepseek.com",
        "todayLabel": "今日",
        "balancePrefix": "余额：",
        "todayPrefix": "今天：",
        "minutesUnit": "分钟",
        "languageLabel": "语言",
        "languageAuto": "自动"
      },
      "zh-Hant": {
        "todayUsage": "今日 {tokens} token",
        "todayUsageCost": "今日 {cost} · {tokens} token",
        "granted": "贈送",
        "topped": "儲值",
        "loading": "讀取中…",
        "balanceError": "餘額取得失敗",
        "usageTitle": "DeepSeek 用量",
        "refresh": "重新整理",
        "refreshing": "整理中…",
        "last7": "近 7 天",
        "thisMonth": "本月",
        "cumulative": "累計",
        "balanceUnavailable": "餘額不可用",
        "localHint": "登入後可查看詳細用量與費用",
        "usageLocalTitle": "本機工作階段日誌 · 僅 token",
        "usageAccountTitle": "帳戶用量（官方）",
        "monthTokens": "本月 token",
        "todayTokens": "今日 token",
        "monthCalls": "本月呼叫次數",
        "updatedAt": "更新於 {time}",
        "autoRefresh": "自動重新整理",
        "sourceAccount": "DSH 帳戶登入",
        "notSignedIn": "未登入 DSH 帳戶",
        "settingsTitle": "DeepSeek 餘額與用量",
        "balanceCard": "目前餘額",
        "apiKeyCard": "API Key（選填）",
        "apiKeyDesc": "留空則使用本機已設定的 DEEPSEEK_API_KEY。手動 Key 透過 DSH credentials 儲存。",
        "apiKeyPlaceholder": "sk-…（留空使用 harness 設定）",
        "saveAndUse": "儲存並使用",
        "usingManualKey": "已使用手動 Key（儲存在本機 credentials）",
        "clearUseHarness": "清除，改回 harness Key",
        "saved": "已儲存",
        "cleared": "已清除，改回 harness Key",
        "accountOk": "✓ 帳戶可用",
        "accountWarn": "⚠ 餘額不足或不可用",
        "keySource": "Key 來源：{source}",
        "keySourceManual": "手動",
        "keySourceHarness": "harness 設定（DEEPSEEK_API_KEY）",
        "readingStats": "正在取得統計…",
        "usageCard": "用量",
        "daysCard": "近 7 天用量",
        "daysLocalNote": "token 來自本機工作階段日誌（本機時區自然日），未登入不估算花費。",
        "daysAccountNote": "token 與費用來自 platform.deepseek.com 後台統計（本機時區自然日）。",
        "noDays": "尚無資料",
        "rejected": "已登入 DSH，但平台拒絕以帳戶工作階段讀取用量",
        "probeError": "帳戶工作階段請求失敗",
        "footerNote": "餘額來自官方 GET /user/balance · 用量來自 platform.deepseek.com",
        "todayLabel": "今日",
        "balancePrefix": "餘額：",
        "todayPrefix": "今天：",
        "minutesUnit": "分鐘",
        "languageLabel": "語言",
        "languageAuto": "自動"
      },
      "ja": {
        "todayUsage": "今日 {tokens} token",
        "todayUsageCost": "今日 {cost} · {tokens} token",
        "granted": "付与分",
        "topped": "チャージ分",
        "loading": "読み込み中…",
        "balanceError": "残高を取得できません",
        "usageTitle": "DeepSeek 使用量",
        "refresh": "更新",
        "refreshing": "更新中…",
        "last7": "直近7日間",
        "thisMonth": "今月",
        "cumulative": "累計",
        "balanceUnavailable": "残高を利用できません",
        "localHint": "ログインすると詳細な使用量と料金を表示します",
        "usageLocalTitle": "ローカルセッションログ · token のみ",
        "usageAccountTitle": "アカウント使用量（公式）",
        "monthTokens": "今月の token",
        "todayTokens": "今日の token",
        "monthCalls": "今月の呼び出し回数",
        "updatedAt": "{time} に更新",
        "autoRefresh": "自動更新",
        "sourceAccount": "DSH アカウント",
        "notSignedIn": "DSH に未ログイン",
        "settingsTitle": "DeepSeek 残高と使用量",
        "balanceCard": "現在の残高",
        "apiKeyCard": "API Key（任意）",
        "apiKeyDesc": "空欄の場合は本機の DEEPSEEK_API_KEY を使用します。手動の Key は DSH credentials に保存されます。",
        "apiKeyPlaceholder": "sk-…（空欄で harness の Key）",
        "saveAndUse": "保存して使用",
        "usingManualKey": "手動 Key を使用中（本機の credentials に保存）",
        "clearUseHarness": "クリアして harness Key に戻す",
        "saved": "保存しました",
        "cleared": "クリアしました（harness Key を使用）",
        "accountOk": "✓ アカウント利用可能",
        "accountWarn": "⚠ 残高不足または利用不可",
        "keySource": "Key の取得元：{source}",
        "keySourceManual": "手動",
        "keySourceHarness": "harness（DEEPSEEK_API_KEY）",
        "readingStats": "統計を取得中…",
        "usageCard": "使用量",
        "daysCard": "直近7日間",
        "daysLocalNote": "token はローカルセッションログ（本機のタイムゾーンの暦日）に基づきます。未ログイン時は料金を算出しません。",
        "daysAccountNote": "token と料金は platform.deepseek.com の統計（本機のタイムゾーンの暦日）に基づきます。",
        "noDays": "データがありません",
        "rejected": "ログイン済みですが、プラットフォームがアカウントセッションでの使用量取得を拒否しました",
        "probeError": "アカウントセッションのリクエストに失敗しました",
        "footerNote": "残高は GET /user/balance · 使用量は platform.deepseek.com から取得",
        "todayLabel": "今日",
        "balancePrefix": "残高：",
        "todayPrefix": "今日：",
        "minutesUnit": "分",
        "languageLabel": "言語",
        "languageAuto": "自動"
      },
      "fr": {
        "todayUsage": "Aujourd'hui {tokens} tok",
        "todayUsageCost": "Aujourd'hui {cost} · {tokens} tok",
        "granted": "Offert",
        "topped": "Rechargé",
        "loading": "Chargement…",
        "balanceError": "Solde indisponible",
        "usageTitle": "Utilisation DeepSeek",
        "refresh": "Actualiser",
        "refreshing": "Actualisation…",
        "last7": "7 derniers jours",
        "thisMonth": "Ce mois-ci",
        "cumulative": "Total",
        "balanceUnavailable": "Solde indisponible",
        "localHint": "l'utilisation détaillée est disponible après connexion",
        "usageLocalTitle": "Journaux de session locaux · tokens uniquement",
        "usageAccountTitle": "Utilisation du compte (officielle)",
        "monthTokens": "Tokens ce mois-ci",
        "todayTokens": "Tokens aujourd'hui",
        "monthCalls": "Appels ce mois-ci",
        "updatedAt": "Mis à jour à {time}",
        "autoRefresh": "Actualisation auto",
        "sourceAccount": "Compte DSH",
        "notSignedIn": "Non connecté à DSH",
        "settingsTitle": "Solde et utilisation DeepSeek",
        "balanceCard": "Solde actuel",
        "apiKeyCard": "Clé API (facultative)",
        "apiKeyDesc": "Laisser vide pour utiliser le DEEPSEEK_API_KEY de cette machine. Une clé manuelle est stockée dans les identifiants DSH.",
        "apiKeyPlaceholder": "sk-… (vide = clé du harness)",
        "saveAndUse": "Enregistrer et utiliser",
        "usingManualKey": "Clé manuelle utilisée (stockée dans les identifiants locaux)",
        "clearUseHarness": "Effacer, utiliser la clé du harness",
        "saved": "Enregistré",
        "cleared": "Effacé, clé du harness utilisée",
        "accountOk": "✓ Compte disponible",
        "accountWarn": "⚠ Solde insuffisant ou indisponible",
        "keySource": "Source de la clé : {source}",
        "keySourceManual": "manuelle",
        "keySourceHarness": "harness (DEEPSEEK_API_KEY)",
        "readingStats": "Chargement des statistiques…",
        "usageCard": "Utilisation",
        "daysCard": "7 derniers jours",
        "daysLocalNote": "Les tokens proviennent des journaux de session locaux (jour civil local) ; le coût n'est pas estimé hors connexion.",
        "daysAccountNote": "Tokens et coût proviennent de platform.deepseek.com (jour civil local).",
        "noDays": "Aucune donnée",
        "rejected": "Connecté, mais la plateforme a refusé la lecture via la session du compte",
        "probeError": "Échec de la requête de session du compte",
        "footerNote": "Solde via GET /user/balance · utilisation via platform.deepseek.com",
        "todayLabel": "Aujourd'hui",
        "balancePrefix": "Solde : ",
        "todayPrefix": "Aujourd'hui : ",
        "minutesUnit": "min",
        "languageLabel": "Langue",
        "languageAuto": "Auto"
      },
      "ru": {
        "todayUsage": "Сегодня {tokens} token",
        "todayUsageCost": "Сегодня {cost} · {tokens} token",
        "granted": "Подарочные",
        "topped": "Пополнено",
        "loading": "Загрузка…",
        "balanceError": "Баланс недоступен",
        "usageTitle": "Использование DeepSeek",
        "refresh": "Обновить",
        "refreshing": "Обновление…",
        "last7": "Последние 7 дней",
        "thisMonth": "В этом месяце",
        "cumulative": "Всего",
        "balanceUnavailable": "Баланс недоступен",
        "localHint": "подробная статистика доступна после входа",
        "usageLocalTitle": "Локальные журналы сессий · только token",
        "usageAccountTitle": "Использование аккаунта (официально)",
        "monthTokens": "Token за месяц",
        "todayTokens": "Token сегодня",
        "monthCalls": "Вызовов за месяц",
        "updatedAt": "Обновлено в {time}",
        "autoRefresh": "Автообновление",
        "sourceAccount": "Аккаунт DSH",
        "notSignedIn": "Вход в DSH не выполнен",
        "settingsTitle": "Баланс и использование DeepSeek",
        "balanceCard": "Текущий баланс",
        "apiKeyCard": "API-ключ (необязательно)",
        "apiKeyDesc": "Оставьте пустым, чтобы использовать DEEPSEEK_API_KEY этой машины. Ручной ключ хранится в учётных данных DSH.",
        "apiKeyPlaceholder": "sk-… (пусто = ключ harness)",
        "saveAndUse": "Сохранить и использовать",
        "usingManualKey": "Используется ручной ключ (хранится в локальных учётных данных)",
        "clearUseHarness": "Очистить и вернуть ключ harness",
        "saved": "Сохранено",
        "cleared": "Очищено, используется ключ harness",
        "accountOk": "✓ Аккаунт доступен",
        "accountWarn": "⚠ Баланс недостаточен или недоступен",
        "keySource": "Источник ключа: {source}",
        "keySourceManual": "ручной",
        "keySourceHarness": "harness (DEEPSEEK_API_KEY)",
        "readingStats": "Получение статистики…",
        "usageCard": "Использование",
        "daysCard": "Последние 7 дней",
        "daysLocalNote": "Token берутся из локальных журналов сессий (местный календарный день); стоимость без входа не оценивается.",
        "daysAccountNote": "Token и стоимость берутся из platform.deepseek.com (местный календарный день).",
        "noDays": "Нет данных",
        "rejected": "Вход выполнен, но платформа отклонила чтение через сессию аккаунта",
        "probeError": "Ошибка запроса сессии аккаунта",
        "footerNote": "Баланс из GET /user/balance · использование из platform.deepseek.com",
        "todayLabel": "Сегодня",
        "balancePrefix": "Баланс: ",
        "todayPrefix": "Сегодня: ",
        "minutesUnit": "мин",
        "languageLabel": "Язык",
        "languageAuto": "Авто"
      },
      "de": {
        "todayUsage": "Heute {tokens} token",
        "todayUsageCost": "Heute {cost} · {tokens} token",
        "granted": "Gutschrift",
        "topped": "Aufgeladen",
        "loading": "Lädt…",
        "balanceError": "Guthaben nicht verfügbar",
        "usageTitle": "DeepSeek-Nutzung",
        "refresh": "Aktualisieren",
        "refreshing": "Aktualisiere…",
        "last7": "Letzte 7 Tage",
        "thisMonth": "Dieser Monat",
        "cumulative": "Gesamt",
        "balanceUnavailable": "Guthaben nicht verfügbar",
        "localHint": "Detaillierte Nutzung nach Anmeldung verfügbar",
        "usageLocalTitle": "Lokale Sitzungsprotokolle · nur token",
        "usageAccountTitle": "Kontonutzung (offiziell)",
        "monthTokens": "Token diesen Monat",
        "todayTokens": "Token heute",
        "monthCalls": "Aufrufe diesen Monat",
        "updatedAt": "Aktualisiert um {time}",
        "autoRefresh": "Automatisch aktualisieren",
        "sourceAccount": "DSH-Konto",
        "notSignedIn": "Nicht bei DSH angemeldet",
        "settingsTitle": "DeepSeek-Guthaben und -Nutzung",
        "balanceCard": "Aktuelles Guthaben",
        "apiKeyCard": "API-Schlüssel (optional)",
        "apiKeyDesc": "Leer lassen, um den DEEPSEEK_API_KEY dieses Rechners zu verwenden. Ein manueller Schlüssel wird in den DSH-Anmeldedaten gespeichert.",
        "apiKeyPlaceholder": "sk-… (leer = Harness-Schlüssel)",
        "saveAndUse": "Speichern und verwenden",
        "usingManualKey": "Manueller Schlüssel aktiv (in lokalen Anmeldedaten gespeichert)",
        "clearUseHarness": "Löschen, Harness-Schlüssel verwenden",
        "saved": "Gespeichert",
        "cleared": "Gelöscht, Harness-Schlüssel aktiv",
        "accountOk": "✓ Konto verfügbar",
        "accountWarn": "⚠ Guthaben unzureichend oder nicht verfügbar",
        "keySource": "Schlüsselquelle: {source}",
        "keySourceManual": "manuell",
        "keySourceHarness": "Harness (DEEPSEEK_API_KEY)",
        "readingStats": "Statistik wird geladen…",
        "usageCard": "Nutzung",
        "daysCard": "Letzte 7 Tage",
        "daysLocalNote": "Token stammen aus lokalen Sitzungsprotokollen (lokaler Kalendertag); ohne Anmeldung werden keine Kosten geschätzt.",
        "daysAccountNote": "Token und Kosten stammen von platform.deepseek.com (lokaler Kalendertag).",
        "noDays": "Keine Daten",
        "rejected": "Angemeldet, aber die Plattform hat den Zugriff über die Kontositzung abgelehnt",
        "probeError": "Anfrage der Kontositzung fehlgeschlagen",
        "footerNote": "Guthaben von GET /user/balance · Nutzung von platform.deepseek.com",
        "todayLabel": "Heute",
        "balancePrefix": "Guthaben: ",
        "todayPrefix": "Heute: ",
        "minutesUnit": "Min",
        "languageLabel": "Sprache",
        "languageAuto": "Auto"
      },
      "es": {
        "todayUsage": "Hoy {tokens} token",
        "todayUsageCost": "Hoy {cost} · {tokens} token",
        "granted": "Regalado",
        "topped": "Recargado",
        "loading": "Cargando…",
        "balanceError": "Saldo no disponible",
        "usageTitle": "Uso de DeepSeek",
        "refresh": "Actualizar",
        "refreshing": "Actualizando…",
        "last7": "Últimos 7 días",
        "thisMonth": "Este mes",
        "cumulative": "Total",
        "balanceUnavailable": "Saldo no disponible",
        "localHint": "el uso detallado está disponible tras iniciar sesión",
        "usageLocalTitle": "Registros de sesión locales · solo token",
        "usageAccountTitle": "Uso de la cuenta (oficial)",
        "monthTokens": "Token este mes",
        "todayTokens": "Token hoy",
        "monthCalls": "Llamadas este mes",
        "updatedAt": "Actualizado a las {time}",
        "autoRefresh": "Actualización automática",
        "sourceAccount": "Cuenta DSH",
        "notSignedIn": "Sin sesión en DSH",
        "settingsTitle": "Saldo y uso de DeepSeek",
        "balanceCard": "Saldo actual",
        "apiKeyCard": "Clave API (opcional)",
        "apiKeyDesc": "Déjalo vacío para usar el DEEPSEEK_API_KEY de este equipo. La clave manual se guarda en las credenciales de DSH.",
        "apiKeyPlaceholder": "sk-… (vacío = clave del harness)",
        "saveAndUse": "Guardar y usar",
        "usingManualKey": "Usando clave manual (guardada en credenciales locales)",
        "clearUseHarness": "Borrar y usar la clave del harness",
        "saved": "Guardado",
        "cleared": "Borrado, usando la clave del harness",
        "accountOk": "✓ Cuenta disponible",
        "accountWarn": "⚠ Saldo insuficiente o no disponible",
        "keySource": "Origen de la clave: {source}",
        "keySourceManual": "manual",
        "keySourceHarness": "harness (DEEPSEEK_API_KEY)",
        "readingStats": "Cargando estadísticas…",
        "usageCard": "Uso",
        "daysCard": "Últimos 7 días",
        "daysLocalNote": "Los token provienen de los registros de sesión locales (día natural local); sin sesión no se estima el coste.",
        "daysAccountNote": "Los token y el coste provienen de platform.deepseek.com (día natural local).",
        "noDays": "Sin datos",
        "rejected": "Sesión iniciada, pero la plataforma rechazó la lectura mediante la sesión de la cuenta",
        "probeError": "Falló la petición de la sesión de la cuenta",
        "footerNote": "Saldo desde GET /user/balance · uso desde platform.deepseek.com",
        "todayLabel": "Hoy",
        "balancePrefix": "Saldo: ",
        "todayPrefix": "Hoy: ",
        "minutesUnit": "min",
        "languageLabel": "Idioma",
        "languageAuto": "Auto"
      }
    }

    function detectLocale() {
      let lang = ''
      try {
        lang = (document.documentElement && document.documentElement.getAttribute('lang')) || ''
      } catch (e) {}
      if (!lang) lang = (typeof navigator !== 'undefined' && navigator.language) || 'en'
      const tag = String(lang).toLowerCase()
      if (tag.indexOf('zh') === 0) {
        if (tag.indexOf('hant') >= 0 || tag.indexOf('tw') >= 0 || tag.indexOf('hk') >= 0 || tag.indexOf('mo') >= 0) return 'zh-Hant'
        return 'zh'
      }
      if (tag.indexOf('ja') === 0) return 'ja'
      if (tag.indexOf('fr') === 0) return 'fr'
      if (tag.indexOf('ru') === 0) return 'ru'
      if (tag.indexOf('de') === 0) return 'de'
      if (tag.indexOf('es') === 0) return 'es'
      return 'en'
    }

    const NS = 'dsh-usage-sidebar'
    const LANGUAGE_OPTIONS = [
      { id: 'zh', label: '简体中文' },
      { id: 'zh-Hant', label: '繁體中文' },
      { id: 'en', label: 'English' },
      { id: 'ja', label: '日本語' },
      { id: 'fr', label: 'Français' },
      { id: 'ru', label: 'Русский' },
      { id: 'de', label: 'Deutsch' },
      { id: 'es', label: 'Español' },
    ]
    const EXTRA_LANGUAGES = ['zh-Hant', 'ja', 'fr', 'ru', 'de', 'es']
    const LOCALE = detectLocale()
    function makeT(dict) {
      return function (key, vars) {
        let text = dict[key]
        if (text === undefined) text = DICT.en[key]
        if (text === undefined) text = key
        if (vars) {
          Object.keys(vars).forEach(function (name) {
            text = text.split('{' + name + '}').join(String(vars[name]))
          })
        }
        return text
      }
    }
    let T = makeT(DICT[LOCALE] || DICT.en)
    let boundT = null
    let languageOverride = null
    try {
      const stored = localStorage.getItem('dsh-usage-sidebar.language')
      if (stored !== null && Object.prototype.hasOwnProperty.call(DICT, stored)) languageOverride = stored
    } catch (e) {}

    function applyLanguage() {
      if (languageOverride !== null) {
        T = makeT(DICT[languageOverride])
        return
      }
      T = boundT !== null ? boundT : makeT(DICT[LOCALE] || DICT.en)
    }

    function setLanguage(lang) {
      languageOverride = lang !== null && Object.prototype.hasOwnProperty.call(DICT, lang) ? lang : null
      try {
        if (languageOverride === null) localStorage.removeItem('dsh-usage-sidebar.language')
        else localStorage.setItem('dsh-usage-sidebar.language', languageOverride)
      } catch (e) {}
      applyLanguage()
      shared.notify()
    }

    function t(key, vars) {
      return T(key, vars)
    }

    async function getJSON(path) {
      const res = await fetch(path, { cache: 'no-store', headers: { 'x-dsh-spend': '1' } })
      const body = await res.json().catch(() => null)
      if (!res.ok || body === null) throw new Error((body && body.error) || 'HTTP ' + res.status)
      return body
    }

    async function saveCredential(ref, value) {
      await fetch(CREDENTIAL_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-dsh-spend': '1' },
        body: JSON.stringify({ ref, value }),
      })
    }

    const shared = (function () {
      let data = null
      let error = null
      let lastFetched = 0
      let inFlight = false
      let stats = null
      let statsError = null
      let statsLastFetched = 0
      let statsInFlight = false
      let manualApiKey = false
      let manualChecked = false
      const listeners = new Set()
      function emit() {
        listeners.forEach(function (fn) {
          try {
            fn()
          } catch (e) {}
        })
      }
      return {
        subscribe(fn) {
          listeners.add(fn)
          return function () {
            listeners.delete(fn)
          }
        },
        snapshot() {
          return { data, error, lastFetched, loading: inFlight, stats, statsError, statsLastFetched, statsLoading: statsInFlight, manualApiKey, manualChecked }
        },
        async checkManual() {
          try {
            const res = await getJSON(CREDENTIAL_PATH)
            manualApiKey = !!(res && res.apiKeyConfigured)
          } catch (e) {
            manualApiKey = false
          } finally {
            manualChecked = true
            emit()
          }
        },
        async saveApiKey(key) {
          await saveCredential(API_KEY_REF, key || '')
          await shared.checkManual()
          await shared.refresh()
        },
        async refresh() {
          if (inFlight) return
          inFlight = true
          emit()
          try {
            const res = await getJSON(BALANCE_PATH)
            if (res && res.ok) {
              data = { is_available: !!res.is_available, balance_infos: res.balance_infos || [], source: res.source }
              error = null
              lastFetched = Date.now()
            } else {
              data = null
              error = (res && res.error) ? String(res.error) : 'error'
            }
          } catch (e) {
            data = null
            error = String((e && e.message) || e)
          } finally {
            inFlight = false
            emit()
          }
        },
        async refreshStats() {
          if (statsInFlight) return
          statsInFlight = true
          emit()
          try {
            const res = await getJSON(STATS_PATH)
            if (res && res.ok) {
              stats = {
                cumulative: res.cumulative,
                month: res.month,
                today: res.today,
                days: Array.isArray(res.days) ? res.days : [],
                currency: res.currency,
                source: res.source,
                accountStatus: res.accountStatus || null,
                local: res.local === true || res.currency === null,
              }
              statsError = null
              statsLastFetched = Date.now()
            } else {
              stats = null
              statsError = (res && res.error) ? String(res.error) : 'error'
            }
          } catch (e) {
            stats = null
            statsError = String((e && e.message) || e)
          } finally {
            statsInFlight = false
            emit()
          }
        },
        tick() {
          shared.refresh()
          shared.refreshStats()
        },
        notify() {
          emit()
        },
      }
    })()

    function fmtMoney(currency, value) {
      const n = Number(value)
      const num = Number.isFinite(n) ? n.toFixed(2) : String(value)
      return currency === 'USD' ? '$' + num : '¥' + num
    }
    function fmtTokens(n) {
      if (!Number.isFinite(n)) return '0'
      if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
      if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
      return String(Math.round(n))
    }
    function fmtTime(ts) {
      if (!ts) return '—'
      const d = new Date(ts)
      const p = function (n) {
        return n < 10 ? '0' + n : String(n)
      }
      return d.getHours() + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
    }
    function primaryBalance(snap) {
      if (!snap.data || !snap.data.balance_infos || !snap.data.balance_infos.length) return null
      return snap.data.balance_infos[0]
    }
    function shortDate(dateKey) {
      return typeof dateKey === 'string' && dateKey.length >= 10 ? dateKey.slice(5) : String(dateKey)
    }

    function DayRows(props) {
      const stats = props.stats
      if (!stats || !stats.days || !stats.days.length) return null
      const local = stats.local === true
      let maxTokens = -1
      stats.days.forEach(function (day) {
        if (day.totalTokens > maxTokens) maxTokens = day.totalTokens
      })
      const rows = stats.days
        .slice()
        .reverse()
        .map(function (day) {
          const isToday = props.todayKey === day.date
          const isMax = maxTokens > 0 && day.totalTokens === maxTokens
          const cls = 'dsp-day' + (isToday ? ' dsp-day-today' : '') + (isMax ? ' dsp-day-max' : '') + (local ? ' dsp-day-local' : '')
          return React.createElement(
            'div',
            { className: cls, key: day.date },
            React.createElement('span', { className: 'dsp-day-date' }, shortDate(day.date)),
            React.createElement('span', { className: 'dsp-day-tok' }, fmtTokens(day.totalTokens) + ' token'),
            local ? null : React.createElement('span', { className: 'dsp-day-cost' }, fmtMoney(stats.currency, day.cost))
          )
        })
      return React.createElement('div', { className: 'dsp-days' }, rows)
    }

    function SidebarSpend(props) {
      const wide = !props || props.wide !== false
      const [snap, setSnap] = React.useState(shared.snapshot())
      const [open, setOpen] = React.useState(false)
      const [minutes, setMinutes] = React.useState(refreshMinutes)
      const [autoOn, setAutoOn] = React.useState(autoRefreshEnabled)
      const rootRef = React.useRef(null)
      React.useEffect(function () {
        const off = shared.subscribe(function () {
          setSnap(shared.snapshot())
        })
        shared.tick()
        return off
      }, [])
      React.useEffect(function () {
        if (!open) return undefined
        const onDown = function (event) {
          if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return function () {
          document.removeEventListener('mousedown', onDown)
        }
      }, [open])

      const bal = primaryBalance(snap)
      const balanceText = bal ? fmtMoney(bal.currency, bal.total_balance) : null
      const today = snap.stats ? snap.stats.today : null
      const local = !!(snap.stats && snap.stats.local)
      const hasDays = !!(snap.stats && snap.stats.days && snap.stats.days.length)
      const todayKey = hasDays ? snap.stats.days[snap.stats.days.length - 1].date : null

      let status = null
      if (!snap.data) status = snap.error ? t('balanceError') : t('loading')
      else if (!snap.stats) status = snap.statsError || t('loading')

      const title = [
        bal ? t('balanceCard') + ': ' + fmtMoney(bal.currency, bal.total_balance) : t('balanceCard'),
        bal ? t('granted') + ' ' + fmtMoney(bal.currency, bal.granted_balance) + ' · ' + t('topped') + ' ' + fmtMoney(bal.currency, bal.topped_up_balance) : null,
        today
          ? local
            ? t('todayUsage', { tokens: fmtTokens(today.totalTokens) })
            : t('todayUsageCost', { cost: fmtMoney(snap.stats.currency, today.cost), tokens: fmtTokens(today.totalTokens) })
          : null,
        local ? t('localHint') : null,
      ]
        .filter(Boolean)
        .join('\n')

      const balanceValue = bal ? Number(bal.total_balance) : null
      const balanceMoney = bal ? '￥' + Number(bal.total_balance).toFixed(2) : '—'
      const balanceClass = balanceValue === null ? 'dsp-chip-bal' : balanceValue < 5 ? 'dsp-chip-bal dsp-chip-bal-low' : 'dsp-chip-bal dsp-chip-bal-ok'
      const todayMoney = today && !local ? '￥' + Number(today.cost).toFixed(2) : null

      const chip = React.createElement(
        'button',
        {
          type: 'button',
          className: 'dsp-chip' + (wide ? '' : ' dsp-chip-rail') + (open ? ' dsp-chip-open' : ''),
          title: title,
          onClick: function () {
            setOpen(function (v) {
              return !v
            })
            if (!open) shared.tick()
          },
        },
        React.createElement(
          'span',
          { className: 'dsp-chip-line' },
          React.createElement('span', { className: 'dsp-chip-bal-wrap' }, React.createElement('span', { className: balanceClass }, t('balancePrefix') + balanceMoney)),
          today
            ? React.createElement(
                'span',
                { className: 'dsp-chip-today' },
                t('todayLabel') + ': ' + fmtTokens(today.totalTokens) + (todayMoney ? ' @ ' + todayMoney : '')
              )
            : null
        )
      )

      const popover = open
        ? React.createElement(
            'div',
            { className: 'dsp-pop' },
            React.createElement(
              'div',
              { className: 'dsp-pop-head' },
              React.createElement('span', { className: 'dsp-pop-title' }, t('usageTitle')),
              React.createElement(
                'button',
                {
                  type: 'button',
                  className: 'dsp-pop-refresh',
                  onClick: function () {
                    shared.tick()
                  },
                  disabled: snap.loading || snap.statsLoading,
                },
                snap.loading || snap.statsLoading ? t('refreshing') : t('refresh')
              )
            ),
            React.createElement(
              'div',
              { className: 'dsp-pop-controls' },
              React.createElement('input', {
                type: 'checkbox',
                className: 'dsp-pop-check',
                checked: autoOn,
                onChange: function (e) {
                  setAutoRefresh(e.target.checked)
                  setAutoOn(e.target.checked)
                },
              }),
              React.createElement('span', { className: 'dsp-pop-unit' }, t('autoRefresh')),
              React.createElement('input', {
                className: 'dsp-pop-min',
                type: 'number',
                min: 1,
                max: 120,
                disabled: !autoOn,
                value: String(minutes),
                onChange: function (e) {
                  const next = setRefreshMinutes(e.target.value)
                  setMinutes(next)
                },
              }),
              React.createElement('span', { className: 'dsp-pop-unit' }, t('minutesUnit'))
            ),
            bal
              ? React.createElement(
                  'div',
                  { className: 'dsp-pop-bal' },
                  React.createElement('strong', null, fmtMoney(bal.currency, bal.total_balance)),
                  React.createElement(
                    'span',
                    { className: 'dsp-pop-bal-sub' },
                    t('granted') + ' ' + fmtMoney(bal.currency, bal.granted_balance) + ' · ' + t('topped') + ' ' + fmtMoney(bal.currency, bal.topped_up_balance)
                  )
                )
              : React.createElement('div', { className: 'dsp-pop-msg' }, snap.error || t('balanceUnavailable')),
            hasDays
              ? React.createElement(
                  'div',
                  null,
                  React.createElement('div', { className: 'dsp-pop-caption' }, t('last7')),
                  React.createElement(DayRows, { stats: snap.stats, todayKey: todayKey })
                )
              : React.createElement('div', { className: 'dsp-pop-msg' }, t('noDays')),
            local ? React.createElement('div', { className: 'dsp-pop-note' }, t('localHint')) : null,
            snap.stats
              ? React.createElement(
                  'div',
                  { className: 'dsp-pop-foot' },
                  local
                    ? t('thisMonth') + ' ' + fmtTokens(snap.stats.month.totalTokens) + ' token'
                    : t('thisMonth') +
                      ' ' +
                      fmtMoney(snap.stats.currency, snap.stats.month.cost) +
                      ' · ' +
                      fmtTokens(snap.stats.month.totalTokens) +
                      ' token · ' +
                      t('cumulative') +
                      ' ' +
                      fmtMoney(snap.stats.currency, snap.stats.cumulative.cost)
                )
              : null,
            React.createElement(
              'div',
              { className: 'dsp-pop-lang' },
              React.createElement('span', { className: 'dsp-pop-lang-label' }, t('languageLabel')),
              React.createElement(
                'select',
                {
                  className: 'dsp-pop-lang-select',
                  value: languageOverride === null ? 'auto' : languageOverride,
                  onChange: function (e) {
                    setLanguage(e.target.value === 'auto' ? null : e.target.value)
                  },
                },
                React.createElement('option', { value: 'auto' }, t('languageAuto')),
                LANGUAGE_OPTIONS.map(function (option) {
                  return React.createElement('option', { value: option.id, key: option.id }, option.label)
                })
              )
            )
          )
        : null

      return React.createElement('div', { className: 'dsp-chip-wrap', ref: rootRef }, chip, popover)
    }

    function BalancePage() {
      const [snap, setSnap] = React.useState(shared.snapshot())
      const [draft, setDraft] = React.useState('')
      const [saving, setSaving] = React.useState(false)
      const [msg, setMsg] = React.useState(null)
      React.useEffect(function () {
        const off = shared.subscribe(function () {
          setSnap(shared.snapshot())
        })
        shared.checkManual()
        shared.tick()
        return off
      }, [])

      const runSave = async function (value, okText) {
        setSaving(true)
        setMsg(null)
        try {
          await shared.saveApiKey(value)
          setDraft('')
          setMsg({ type: 'ok', text: okText })
        } catch (e) {
          setMsg({ type: 'err', text: String((e && e.message) || e) })
        } finally {
          setSaving(false)
        }
      }

      const local = !!(snap.stats && snap.stats.local)
      const rows = []
      if (snap.data) {
        snap.data.balance_infos.forEach(function (b, i) {
          rows.push(
            React.createElement(
              'div',
              { className: 'dsp-cell', key: 'cell-' + i },
              React.createElement('div', { className: 'dsp-cell-label' }, t('balanceCard') + ' (' + b.currency + ')'),
              React.createElement('div', { className: 'dsp-cell-value' }, fmtMoney(b.currency, b.total_balance)),
              React.createElement(
                'div',
                { className: 'dsp-muted', style: { marginTop: 4 } },
                t('granted') + ' ' + fmtMoney(b.currency, b.granted_balance) + ' · ' + t('topped') + ' ' + fmtMoney(b.currency, b.topped_up_balance)
              )
            )
          )
        })
      }

      const balanceCard = React.createElement(
        'div',
        { className: 'dsp-card', key: 'balance' },
        React.createElement(
          'div',
          { className: 'dsp-row', style: { justifyContent: 'space-between' } },
          React.createElement('h3', { className: 'dsp-title', style: { margin: 0 } }, t('balanceCard')),
          React.createElement(
            'button',
            {
              className: 'dsp-btn',
              onClick: function () {
                shared.refresh()
              },
              disabled: snap.loading,
            },
            snap.loading ? t('refreshing') : t('refresh')
          )
        ),
        snap.data
          ? React.createElement(
              'div',
              null,
              React.createElement('div', { className: snap.data.is_available ? 'dsp-ok' : 'dsp-warn', style: { fontWeight: 600 } }, snap.data.is_available ? t('accountOk') : t('accountWarn')),
              React.createElement('div', { className: 'dsp-grid' }, rows),
              React.createElement(
                'div',
                { className: 'dsp-muted', style: { marginTop: 10 } },
                t('keySource', { source: snap.data.source === 'manual' ? t('keySourceManual') : t('keySourceHarness') }) +
                  ' · ' +
                  t('updatedAt', { time: fmtTime(snap.lastFetched) }) +
                  ' · ' +
                  t('autoRefresh')
              )
            )
          : React.createElement('div', { className: 'dsp-status ' + (snap.error ? 'dsp-err' : 'dsp-muted') }, snap.loading ? t('loading') : snap.error || t('balanceUnavailable'))
      )

      const apiKeyCard = React.createElement(
        'div',
        { className: 'dsp-card', key: 'key' },
        React.createElement('h3', { className: 'dsp-title' }, t('apiKeyCard')),
        React.createElement('p', { className: 'dsp-sub' }, t('apiKeyDesc')),
        React.createElement(
          'div',
          { className: 'dsp-row' },
          React.createElement('input', {
            className: 'dsp-input',
            type: 'password',
            placeholder: t('apiKeyPlaceholder'),
            value: draft,
            onChange: function (e) {
              setDraft(e.target.value)
            },
          }),
          React.createElement('button', { className: 'dsp-btn', onClick: function () { runSave(draft, t('saved')) }, disabled: saving }, t('saveAndUse'))
        ),
        snap.manualApiKey
          ? React.createElement(
              'div',
              { className: 'dsp-row' },
              React.createElement('span', { className: 'dsp-muted' }, t('usingManualKey')),
              React.createElement('button', { className: 'dsp-btn', onClick: function () { runSave('', t('cleared')) }, disabled: saving }, t('clearUseHarness'))
            )
          : null
      )

      const usageBody = snap.stats
        ? React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'dsp-big' }, local ? t('usageLocalTitle') : t('usageAccountTitle')),
            React.createElement(
              'div',
              { className: 'dsp-grid' },
              React.createElement(
                'div',
                { className: 'dsp-cell', key: 's1' },
                React.createElement('div', { className: 'dsp-cell-label' }, local ? t('monthTokens') : t('thisMonth')),
                React.createElement(
                  'div',
                  { className: 'dsp-cell-value' },
                  local ? fmtTokens(snap.stats.month.totalTokens) : fmtMoney(snap.stats.currency, snap.stats.month.cost)
                ),
                React.createElement('div', { className: 'dsp-muted', style: { marginTop: 4 } }, fmtTokens(snap.stats.month.totalTokens) + ' token')
              ),
              React.createElement(
                'div',
                { className: 'dsp-cell', key: 's2' },
                React.createElement('div', { className: 'dsp-cell-label' }, local ? t('todayTokens') : t('todayLabel')),
                React.createElement(
                  'div',
                  { className: 'dsp-cell-value' },
                  local ? fmtTokens(snap.stats.today.totalTokens) : fmtMoney(snap.stats.currency, snap.stats.today.cost)
                ),
                React.createElement('div', { className: 'dsp-muted', style: { marginTop: 4 } }, fmtTokens(snap.stats.today.totalTokens) + ' token')
              ),
              React.createElement(
                'div',
                { className: 'dsp-cell', key: 's3' },
                React.createElement('div', { className: 'dsp-cell-label' }, t('monthCalls')),
                React.createElement('div', { className: 'dsp-cell-value' }, fmtTokens(snap.stats.month.calls)),
                React.createElement('div', { className: 'dsp-muted', style: { marginTop: 4 } }, local ? t('notSignedIn') : t('sourceAccount'))
              )
            ),
            React.createElement(
              'div',
              { className: 'dsp-muted', style: { marginTop: 10 } },
              (local
                ? snap.stats.accountStatus === 'rejected'
                  ? t('rejected')
                  : snap.stats.accountStatus === 'error'
                    ? t('probeError')
                    : t('notSignedIn')
                : t('sourceAccount')) +
                ' · ' +
                t('updatedAt', { time: fmtTime(snap.statsLastFetched) }) +
                ' · ' +
                t('autoRefresh')
            ),
            local ? React.createElement('div', { className: 'dsp-hint' }, t('localHint')) : null
          )
        : React.createElement('div', { className: 'dsp-status ' + (snap.statsError ? 'dsp-err' : 'dsp-muted') }, snap.statsLoading ? t('readingStats') : snap.statsError || t('noDays'))

      const usageCard = React.createElement('div', { className: 'dsp-card', key: 'usage' }, React.createElement('h3', { className: 'dsp-title' }, t('usageCard')), usageBody)

      const daysCard =
        snap.stats && snap.stats.days && snap.stats.days.length
          ? React.createElement(
              'div',
              { className: 'dsp-card', key: 'days' },
              React.createElement('h3', { className: 'dsp-title' }, t('daysCard')),
              React.createElement(DayRows, { stats: snap.stats, todayKey: snap.stats.days[snap.stats.days.length - 1].date }),
              React.createElement('div', { className: 'dsp-muted', style: { marginTop: 8 } }, local ? t('daysLocalNote') : t('daysAccountNote'))
            )
          : null

      return React.createElement(
        'div',
        { className: 'dsp-page' },
        balanceCard,
        apiKeyCard,
        usageCard,
        daysCard,
        React.createElement('p', { className: 'dsp-muted' }, t('footerNote')),
        msg ? React.createElement('p', { className: msg.type === 'ok' ? 'dsp-ok' : 'dsp-err' }, msg.text) : null
      )
    }

    const CSS =
      '.dsp-page{display:flex;flex-direction:column;gap:12px;padding:2px 2px 18px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}' +
      '.dsp-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:14px}' +
      '.dsp-title{font-size:14px;font-weight:600;margin:0 0 4px}' +
      '.dsp-sub{color:var(--dsw-alias-label-secondary);font-size:12px;margin:0 0 10px}' +
      '.dsp-row{display:flex;align-items:center;gap:8px;margin-top:8px}' +
      '.dsp-input{flex:1;min-width:0;padding:7px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}' +
      '.dsp-btn{padding:6px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:12px;white-space:nowrap}' +
      '.dsp-btn:hover{border-color:var(--dsw-alias-brand-primary)}' +
      '.dsp-btn:disabled{opacity:.55;cursor:default}' +
      '.dsp-ok{color:var(--dsw-alias-state-success-primary)}' +
      '.dsp-warn{color:var(--dsw-alias-state-warn-primary)}' +
      '.dsp-err{color:var(--dsw-alias-state-error-primary)}' +
      '.dsp-muted{color:var(--dsw-alias-label-secondary);font-size:12px}' +
      '.dsp-hint{margin-top:8px;padding:6px 8px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11px}' +
      '.dsp-big{font-size:18px;font-weight:700;margin-top:4px}' +
      '.dsp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:10px}' +
      '.dsp-cell{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:10px}' +
      '.dsp-cell-label{color:var(--dsw-alias-label-secondary);font-size:12px;margin-bottom:4px}' +
      '.dsp-cell-value{font-size:16px;font-weight:700}' +
      '.dsp-status{margin-top:4px;font-size:12px}' +
      '.dsp-chip-wrap{position:relative;display:flex;width:100%;justify-content:stretch}' +
      '.dsp-chip{display:flex;flex-direction:column;gap:2px;width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;font:inherit;line-height:1.2}' +
      '.dsp-chip:hover{border-color:var(--dsw-alias-brand-primary)}' +
      '.dsp-chip-open{border-color:var(--dsw-alias-brand-primary)}' +
      '.dsp-chip-rail{padding:4px;align-items:center}' +
      '.dsp-chip-line{display:flex;align-items:baseline;gap:8px;white-space:nowrap;overflow:hidden;font-size:11px;line-height:1.3}' +
      '.dsp-chip-bal-wrap{flex:0 0 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}' +
      '.dsp-chip-today{margin-left:auto;flex:0 0 auto;color:var(--dsw-alias-label-primary);white-space:nowrap}' +
      '.dsp-chip-bal{font-weight:600;color:var(--dsw-alias-label-primary)}' +
      '.dsp-chip-bal-ok{color:var(--dsw-alias-state-success-primary)}' +
      '.dsp-chip-bal-low{color:var(--dsw-alias-state-error-primary)}' +
      '.dsp-chip-today,.dsp-chip-tokens{color:var(--dsw-alias-label-secondary)}' +
      '.dsp-chip-rail .dsp-chip-bal{font-size:11px}' +
      '.dsp-chip-sub{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.dsp-pop{position:fixed;left:10px;bottom:70px;z-index:80;width:280px;box-sizing:border-box;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);box-shadow:0 12px 32px rgba(0,0,0,.18);color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.5}' +
      '.dsp-pop-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}' +
      '.dsp-pop-title{font-size:13px;font-weight:600}' +
      '.dsp-pop-refresh{padding:3px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:11px}' +
      '.dsp-pop-refresh:disabled{opacity:.55;cursor:default}' +
      '.dsp-pop-bal{display:flex;flex-direction:column;gap:2px;margin-bottom:8px}' +
      '.dsp-pop-bal strong{font-size:18px}' +
      '.dsp-pop-bal-sub,.dsp-pop-foot,.dsp-pop-msg,.dsp-pop-note{color:var(--dsw-alias-label-secondary);font-size:11px}' +
      '.dsp-pop-caption{margin:6px 0 4px;color:var(--dsw-alias-label-secondary);font-size:11px}' +
      '.dsp-pop-note{margin-top:6px;padding-top:6px;border-top:1px solid var(--dsw-alias-border-l1)}' +
      '.dsp-days{display:flex;flex-direction:column;gap:2px}' +
      '.dsp-day{display:grid;grid-template-columns:1fr 96px 62px;gap:6px;align-items:center;padding:3px 6px;border-radius:6px}' +
      '.dsp-day-local{grid-template-columns:1fr 84px}' +
      '.dsp-day-today{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary)}' +
      '.dsp-day-today .dsp-day-tok,.dsp-day-today .dsp-day-date{color:var(--dsw-alias-brand-primary)}' +
      '.dsp-day-max{font-weight:700}' +
      '.dsp-pop-actions{display:flex;align-items:center;gap:4px}' +
      '.dsp-pop-min{width:42px;padding:2px 4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:11px}' +
      '.dsp-pop-unit{color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap}' +
      '.dsp-pop-controls{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin:0 0 8px;color:var(--dsw-alias-label-secondary);font-size:11px}' +
      '.dsp-pop-check{margin:0;accent-color:var(--dsw-alias-brand-primary)}' +
      '.dsp-day-date{color:var(--dsw-alias-label-primary)}' +
      '.dsp-day-tok{color:var(--dsw-alias-label-secondary);text-align:right;white-space:nowrap}' +
      '.dsp-day-cost{text-align:right;font-variant-numeric:tabular-nums}' +
      '.dsp-pop-foot{margin-top:8px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1)}' +
      '.dsp-pop-lang{display:flex;align-items:center;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font-size:11px}' +
      '.dsp-pop-lang-label{margin-right:2px}' +
      '.dsp-pop-lang-btn{padding:2px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:11px}' +
      '.dsp-pop-lang-btn:hover{border-color:var(--dsw-alias-brand-primary)}' +
      '.dsp-pop-lang-select{flex:1;min-width:0;padding:2px 4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:11px}' +
      '.dsp-pop-lang-active{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);font-weight:600}'

    const DEFAULT_MINUTES = 5
    let refreshMinutes = DEFAULT_MINUTES
    let tickTimer = null
    let pluginCtx = null

    function readRefreshMinutes() {
      try {
        const value = Number(localStorage.getItem('dsh-usage-sidebar.refreshMinutes'))
        return Number.isFinite(value) && value >= 1 ? value : DEFAULT_MINUTES
      } catch (e) {
        return DEFAULT_MINUTES
      }
    }

    let autoRefreshEnabled = true
    try {
      const storedAuto = localStorage.getItem('dsh-usage-sidebar.autoRefresh')
      if (storedAuto !== null) autoRefreshEnabled = storedAuto === '1'
    } catch (e) {}

    function setAutoRefresh(enabled) {
      autoRefreshEnabled = !!enabled
      try {
        localStorage.setItem('dsh-usage-sidebar.autoRefresh', autoRefreshEnabled ? '1' : '0')
      } catch (e) {}
      scheduleRefresh()
      shared.notify()
    }

    function scheduleRefresh() {
      if (tickTimer !== null) clearTimeout(tickTimer)
      tickTimer = null
      if (!autoRefreshEnabled) return
      tickTimer = setTimeout(function () {
        shared.tick()
        scheduleRefresh()
      }, refreshMinutes * 60000)
    }

    function setRefreshMinutes(minutes) {
      const next = Math.max(1, Math.min(120, Math.round(Number(minutes) || DEFAULT_MINUTES)))
      refreshMinutes = next
      try {
        localStorage.setItem('dsh-usage-sidebar.refreshMinutes', String(next))
      } catch (e) {}
      scheduleRefresh()
      return next
    }

    function apply(ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined) return
      ctx.effect(function () {
        const styleEl = document.createElement('style')
        styleEl.dataset.dsh = 'dsh-usage-sidebar'
        styleEl.textContent = CSS
        document.head.appendChild(styleEl)
        return function () {
          styleEl.remove()
        }
      })
      slots.inject('settings.section', function () {
        return slots.register(
          { name: 'settings.section', id: 'dsh-usage-sidebar', order: 30, label: D.settingsTitle },
          function () {
            return React.createElement(BalancePage)
          }
        )
      })
      slots.inject('sidebar.footer.action', function () {
        return slots.register({ name: 'sidebar.footer.action', id: 'dsh-usage-sidebar-footer', order: 20 }, SidebarSpend)
      })
      pluginCtx = ctx
      refreshMinutes = readRefreshMinutes()
      try {
        const storedAuto = localStorage.getItem('dsh-usage-sidebar.autoRefresh')
        if (storedAuto !== null) autoRefreshEnabled = storedAuto === '1'
      } catch (e) {}
      const locale = ctx.get('locale')
      if (locale !== undefined && typeof locale.register === 'function') {
        ctx.effect(function () {
          return locale.register(NS, { zh: DICT.zh, en: DICT.en })
        }, 'dsh-usage-sidebar: dictionaries')
        if (typeof locale.addLanguage === 'function') {
          EXTRA_LANGUAGES.forEach(function (id) {
            const label = LANGUAGE_OPTIONS.filter(function (o) { return o.id === id })[0].label
            try {
              ctx.effect(function () {
                return locale.addLanguage({ id: id, label: label, fallback: 'en' })
              }, 'dsh-usage-sidebar: language ' + id)
              ctx.effect(function () {
                return locale.register(NS, id, DICT[id])
              }, 'dsh-usage-sidebar: dictionary ' + id)
            } catch (e) {}
          })
        }
        if (typeof locale.bind === 'function') {
          const bound = locale.bind(NS)
          boundT = function (key, vars) {
            let text = bound(key)
            if (typeof text !== 'string' || text === '') text = key
            if (vars) {
              Object.keys(vars).forEach(function (name) {
                text = text.split('{' + name + '}').join(String(vars[name]))
              })
            }
            return text
          }
          applyLanguage()
        }
      }
      applyLanguage()
      ctx.effect(function () {
        return function () {
          if (tickTimer !== null) clearTimeout(tickTimer)
          tickTimer = null
        }
      }, 'dsh-usage-sidebar: refresh timer')
      scheduleRefresh()
      shared.tick()
    }

    const inject = ['slots', 'timer', 'locale']
    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
