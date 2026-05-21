/**
 * GOOGLE ADS GOD MODE ENGINE - THE GITHUB DATABASE CORE (V10.0)
 * Replaces Spreadsheet-bridge with a direct serverless GitHub JSON bridge.
 */

const GITHUB_TOKEN = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"; 
const REPO = "LaminatedYamal/ULUS-FONA";
const CONFIG_PATH = "ads_config.json";
const CAMPAIGN_NAME = "Campanha_Teste_Sandbox"; 

function main() {
  Logger.log("🚀 Iniciando GOD MODE V10.0 (GitHub Core)...");
  
  let gitData = fetchFromGitHub(CONFIG_PATH);
  if (!gitData) {
    Logger.log("❌ ERRO: Não foi possível obter o arquivo de configuração do GitHub.");
    return;
  }
  
  let config = JSON.parse(gitData.content);
  let sha = gitData.sha;
  let hasChanges = false;

  for (let courseName in config) {
    let course = config[courseName];
    let command = (course.status || "").toString().trim(); 

    if (command !== "START" && command !== "PAUSED" && command !== "DEPLOYED" && command !== "ACTIVE") continue;

    Logger.log("-----------------------------------------");
    Logger.log("⚡ PROCESSANDO CURSO: " + courseName);

    let adGroup = getOrCreateAdGroup(courseName);
    if (!adGroup) continue;

    // 🛑 KILL SWITCH / REMOTE CONTROL
    if (command === "PAUSED") {
      if (adGroup.isEnabled()) {
        adGroup.pause();
        Logger.log("🔴 Ad Group Pausado: " + courseName);
      }
      course.status = "DEPLOYED";
      hasChanges = true;
      continue; 
    } else if (adGroup.isPaused() && (command === "START" || command === "ACTIVE")) {
      adGroup.enable();
      Logger.log("🟢 Ad Group Ativado: " + courseName);
    }

    // 🧠 THE TWO-WAY BRAIN (Check changes)
    let syncAction = determineSyncAction(course, adGroup);

    if (syncAction === "PUSH_TO_ADS") {
      Logger.log("   📤 Dashboard Editado Recentemente. Atualizando o Google Ads...");
      processKeywords(course, adGroup);
      createRSA(course, adGroup);
      createSitelinks(course, adGroup);
      createStructuredSnippets(course, adGroup);
      course.lastSynced = new Date().toISOString();
      course.status = "DEPLOYED";
      hasChanges = true;
    } 
    else if (syncAction === "PULL_FROM_ADS") {
      Logger.log("   📥 Alteração detetada no Google Ads. Atualizando Config...");
      pullFromAdsToConfig(course, adGroup);
      course.lastSynced = new Date().toISOString();
      hasChanges = true;
    }

    // Always update Live Pulse statistics on every run
    if (updateLivePulse(course, adGroup)) {
      hasChanges = true;
    }
  }

  if (hasChanges) {
    Logger.log("💾 Salvando atualizações de volta no GitHub...");
    pushToGitHub(CONFIG_PATH, JSON.stringify(config, null, 2), sha);
  } else {
    Logger.log("✅ Tudo perfeitamente sincronizado. Nenhuma escrita necessária.");
  }
}

/** 🌐 GITHUB API HELPERS */
function fetchFromGitHub(path) {
  let url = "https://api.github.com/repos/" + REPO + "/contents/" + path;
  let options = {
    headers: {
      "Authorization": "token " + GITHUB_TOKEN,
      "Accept": "application/vnd.github.v3+json"
    },
    muteHttpExceptions: true
  };
  let response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    let resObj = JSON.parse(response.getContentText());
    let rawContent = Utilities.newBlob(Utilities.base64Decode(resObj.content)).getDataAsString("UTF-8");
    return {
      content: rawContent,
      sha: resObj.sha
    };
  }
  return null;
}

function pushToGitHub(path, content, sha) {
  let url = "https://api.github.com/repos/" + REPO + "/contents/" + path;
  let payload = {
    message: "Sync stats and status from Google Ads [skip ci]",
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: "main"
  };
  if (sha) payload.sha = sha;

  let options = {
    method: "PUT",
    headers: {
      "Authorization": "token " + GITHUB_TOKEN,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  let res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() !== 200 && res.getResponseCode() !== 201) {
    Logger.log("🚨 ERRO ao escrever no GitHub: Code " + res.getResponseCode() + " - " + res.getContentText());
  } else {
    Logger.log("✅ Sincronização guardada no GitHub com sucesso.");
  }
}

/** 🛠️ HELPER: RESTORE MATCH TYPE PUNCTUATION */
function getFormattedKwText(kw) {
  let text = kw.getText().toLowerCase();
  let matchType = kw.getMatchType();
  if (matchType === "PHRASE") return '"' + text + '"';
  if (matchType === "EXACT") return '[' + text + ']';
  return text; 
}

/** 🧠 BRAIN: DECIDE WHETHER TO PUSH OR PULL */
function determineSyncAction(course, adGroup) {
  let dashboardLastUpdated = new Date(course.lastUpdated || 0).getTime();
  let lastSynced = new Date(course.lastSynced || 0).getTime();

  if (dashboardLastUpdated > lastSynced) return "PUSH_TO_ADS";

  let isAdsDifferent = checkIfAdsIsDifferent(course, adGroup);
  if (isAdsDifferent) return "PULL_FROM_ADS";

  return "IN_SYNC";
}

/** 🔍 DETECT CHANGES IN ADS DIRECTLY */
function checkIfAdsIsDifferent(course, adGroup) {
  let kwMap = {};
  (course.keywords || []).forEach(k => {
    if (k.text) {
      let t = k.text.toString().replace(/[!@%,*]/g, "").trim().toLowerCase();
      let status = k.status === "ENABLED" ? "ENABLED" : "PAUSED";
      kwMap[t] = status;
    }
  });

  let adKws = adGroup.keywords().withCondition("Status IN [ENABLED, PAUSED]").get();
  let adKwCount = 0;
  while (adKws.hasNext()) {
    let kw = adKws.next();
    let text = getFormattedKwText(kw);
    let status = kw.isEnabled() ? "ENABLED" : "PAUSED";
    adKwCount++;
    if (!kwMap[text] || kwMap[text] !== status) return true; 
  }
  if (adKwCount !== Object.keys(kwMap).length) return true; 

  let finalUrl = (course.finalUrl || "").toString().trim();
  let p1 = (course.path1 || "").toString().replace(/[^a-zA-Z0-9]/g, "").substring(0, 15);
  let p2 = (course.path2 || "").toString().replace(/[^a-zA-Z0-9]/g, "").substring(0, 15);
  let headlines = (course.headlines || []).filter(String).map(h => h.toString().replace(/!/g, "").substring(0, 30).trim());

  let adIterator = adGroup.ads().withCondition("Type = RESPONSIVE_SEARCH_AD").withCondition("Status = ENABLED").get();
  if (!adIterator.hasNext() && headlines.length > 0) return true; 

  if (adIterator.hasNext()) {
    let rsa = adIterator.next().asType().responsiveSearchAd();
    if ((rsa.urls().getFinalUrl() || "") !== finalUrl) return true;
    if ((rsa.getPath1() || "") !== p1 || (rsa.getPath2() || "") !== p2) return true;
  }
  return false; 
}

/** 📥 PULL: ADS -> CONFIG */
function pullFromAdsToConfig(course, adGroup) {
  let adIterator = adGroup.ads().withCondition("Type = RESPONSIVE_SEARCH_AD").withCondition("Status = ENABLED").orderBy("Id DESC").get();
  if (adIterator.hasNext()) {
    let liveAd = adIterator.next().asType().responsiveSearchAd();
    course.headlines = liveAd.getHeadlines().map(h => h.text);
    course.descriptions = liveAd.getDescriptions().map(d => d.text);
    course.path1 = liveAd.getPath1() || "";
    course.path2 = liveAd.getPath2() || "";
  }

  let kwIterator = adGroup.keywords().withCondition("Status IN [ENABLED, PAUSED]").get();
  course.keywords = [];
  while (kwIterator.hasNext() && course.keywords.length < 20) {
    let kw = kwIterator.next();
    course.keywords.push({
      status: kw.isEnabled() ? "ENABLED" : "PAUSED",
      text: getFormattedKwText(kw)
    });
  }
}

/** 📤 PUSH: KEYWORDS */
function processKeywords(course, adGroup) {
  let courseKws = []; 
  let existingKws = {};
  
  let kwIterator = adGroup.keywords().get();
  while (kwIterator.hasNext()) { 
    let kw = kwIterator.next(); 
    existingKws[getFormattedKwText(kw)] = kw; 
  }

  (course.keywords || []).forEach(k => {
    let rawKw = k.text;
    if (rawKw) {
      let cleanKW = rawKw.toString().replace(/[!@%,*]/g, "").trim().toLowerCase(); 
      if (cleanKW.length > 0) {
        courseKws.push(cleanKW); 
        let desiredStatus = k.status === "ENABLED" ? "ENABLED" : "PAUSED";
        
        if (existingKws[cleanKW]) {
          let liveKw = existingKws[cleanKW];
          if (desiredStatus === "ENABLED" && liveKw.isPaused()) { liveKw.enable(); Logger.log("   🟢 Kw Ativada: " + cleanKW); }
          else if (desiredStatus === "PAUSED" && liveKw.isEnabled()) { liveKw.pause(); Logger.log("   🟡 Kw Pausada: " + cleanKW); }
        } else {
          let kwOp = adGroup.newKeywordBuilder().withText(cleanKW).build();
          if (kwOp.isSuccessful()) {
            if (desiredStatus === "PAUSED") kwOp.getResult().pause();
            Logger.log("   ➕ Nova Kw Criada: " + cleanKW);
          } else Logger.log("   ❌ ERRO ao criar Kw [" + cleanKW + "]: " + kwOp.getErrors());
        }
      }
    }
  });

  for (let kwText in existingKws) {
    if (!courseKws.includes(kwText)) {
      let liveKw = existingKws[kwText];
      if (liveKw.isEnabled()) { liveKw.pause(); Logger.log("   👻 Ghost Killer: Pausada -> [" + kwText + "]"); }
    }
  }
}

/** 📤 PUSH: RSA */
function createRSA(course, adGroup) {
  let headlines = (course.headlines || []).filter(String).map(h => h.toString().replace(/!/g, "").substring(0, 30).trim());
  let descriptions = (course.descriptions || []).filter(String).map(d => d.toString().substring(0, 90).trim());
  let finalUrl = (course.finalUrl || "").toString().trim();
  let p1 = (course.path1 || "").toString().replace(/[^a-zA-Z0-9]/g, "").substring(0, 15);
  let p2 = (course.path2 || "").toString().replace(/[^a-zA-Z0-9]/g, "").substring(0, 15);

  if (headlines.length < 3 || descriptions.length < 2 || !finalUrl) return;

  let adIterator = adGroup.ads().withCondition("Type = RESPONSIVE_SEARCH_AD").withCondition("Status = ENABLED").get();
  let existingAds = [];
  while (adIterator.hasNext()) { existingAds.push(adIterator.next()); }
  if (existingAds.length > 0) existingAds.forEach(ad => ad.pause());

  let builder = adGroup.newAd().responsiveSearchAdBuilder().withFinalUrl(finalUrl);
  headlines.forEach(h => builder.addHeadline(h));
  descriptions.forEach(d => builder.addDescription(d));
  if (p1) builder.withPath1(p1);
  if (p2) builder.withPath2(p2);

  let op = builder.build();
  if (op.isSuccessful()) Logger.log("   ✅ RSA Atualizado.");
  else Logger.log("   🚨 ERRO NO RSA: " + op.getErrors());
}

/** 📤 PUSH: SITELINKS */
function createSitelinks(course, adGroup) {
  let sitelinks = course.sitelinks || [];
  let sheetSl = [];
  sitelinks.forEach(row => {
    let sH = row.headline ? row.headline.toString().replace(/!/g, "").substring(0, 25).trim() : ""; 
    let sU = row.url ? row.url.toString().trim() : "";
    if (sH && sU) {
      sheetSl.push({
        t: sH, 
        u: sU, 
        d1: row.desc1 ? row.desc1.toString().substring(0,35) : "", 
        d2: row.desc2 ? row.desc2.toString().substring(0,35) : ""
      });
    }
  });

  let liveSlIter = adGroup.extensions().sitelinks().get();
  let liveSl = {};
  while (liveSlIter.hasNext()) { let sl = liveSlIter.next(); liveSl[sl.getLinkText()] = sl; }

  for (let t in liveSl) if (!sheetSl.some(s => s.t === t)) adGroup.removeSitelink(liveSl[t]);

  sheetSl.forEach(s => {
    if (!liveSl[s.t]) {
      let op = AdsApp.extensions().newSitelinkBuilder().withLinkText(s.t).withDescription1(s.d1).withDescription2(s.d2).withFinalUrl(s.u).build();
      if (op.isSuccessful()) adGroup.addSitelink(op.getResult());
    }
  });
}

/** 📤 PUSH: SNIPPETS */
function createStructuredSnippets(course, adGroup) {
  let snippets = course.snippets || {};
  let header = snippets.header;
  let values = (snippets.values || []).filter(String).map(v => v.toString().substring(0, 25).trim());
  if (!header || values.length === 0) return;

  let sheetSnipStr = values.join(",");
  let liveSnips = adGroup.extensions().snippets().get();
  let hasExact = false;

  while (liveSnips.hasNext()) {
    let snip = liveSnips.next();
    if (snip.getHeader() === header && snip.getValues().join(",") === sheetSnipStr) hasExact = true;
    else adGroup.removeSnippet(snip); 
  }

  if (!hasExact) {
    let op = AdsApp.extensions().newSnippetBuilder().withHeader(header.toString()).withValues(values).build();
    if (op.isSuccessful()) adGroup.addSnippet(op.getResult());
  }
}

/** 📊 LIVE PULSE (Update stats in Config) */
function updateLivePulse(course, adGroup) {
  let stats = adGroup.getStatsFor("LAST_30_DAYS");
  let budget = adGroup.getCampaign().getBudget().getAmount(); 
  let costPerConv = stats.getConversions() > 0 ? (stats.getCost() / stats.getConversions()).toFixed(2) + " €" : "0.00 €";

  let oldPulse = course.livePulse || {};
  let newPulse = {
    budget: budget + " €",
    clicks: stats.getClicks(),
    impressions: stats.getImpressions(),
    cost: stats.getCost() + " €",
    conversions: stats.getConversions(),
    costPerConv: costPerConv,
    period: "Últimos 30 Dias"
  };

  // Check if anything changed to avoid unnecessary commits
  if (JSON.stringify(oldPulse) !== JSON.stringify(newPulse)) {
    course.livePulse = newPulse;
    return true;
  }
  return false;
}

function getOrCreateAdGroup(name) {
  let campIter = AdsApp.campaigns().withCondition("Name = '" + CAMPAIGN_NAME + "'").get();
  if (!campIter.hasNext()) return null;
  let clean = name.substring(0, 100).trim();
  let agIter = campIter.next().adGroups().withCondition("Name = '" + clean + "'").get();
  if (agIter.hasNext()) return agIter.next();
  let op = campIter.next().newAdGroupBuilder().withName(clean).withStatus("ENABLED").build();
  return op.isSuccessful() ? op.getResult() : null;
}

/** ⏰ AUTOMATED SETUP TRIGGER (Runs every 10 minutes) */
function setupTrigger() {
  let triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'main') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('main')
    .timeBased()
    .everyMinutes(10)
    .create();
}
