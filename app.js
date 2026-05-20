// =======================
// 地図初期化
// =======================
const map = L.map('map', {
  zoomControl: false,
  attributionControl: false
}).setView([34.685, 135.832], 9);

L.tileLayer('', {}).addTo(map);

// =======================
// 管理用データ
// =======================
let layerMap = {};
let areaStatus = {};

// =======================
// 色定義
// =======================
function getColorByLevel(level) {
  switch(level) {
    case "advisory": return "#F2E700";
    case "warning": return "#FF2800";
    case "danger": return "#AA00AA";
    case "special": return "#0C000C";
    default: return "#ffffff";
  }
}

// =======================
// 状態更新
// =======================
function updateLayerColor(name) {
  const layer = layerMap[name];
  const level = areaStatus[name];
  const color = getColorByLevel(level);

  if (layer) {
    layer.setStyle({
      fillColor: color,
      fillOpacity: 0.8,
      color: "#333",
      weight: 1
    });
  }

//  localStorage.setItem("areaStatus", JSON.stringify(areaStatus));
}


// =======================
// クリックで状態ループ
// =======================
const levelsOrder = ["", "advisory", "warning", "danger", "special"];

function getNextLevel(current) {
  const index = levelsOrder.indexOf(current);
  return levelsOrder[(index + 1) % levelsOrder.length];
}

// =======================
// 個別ラジオ同期
// =======================
function syncIndividualRadios(name, level) {
  const radios = document.getElementsByName(name);
  radios.forEach(r => {
    if (r.value === level) {
      r.checked = true;
    }
  });
}

// =======================
// 地図イベント
// =======================
function onEachFeature(feature, layer) {
  const name = feature.properties.name;

  layerMap[name] = layer;

  layer.on({

    click: () => {
      const current = areaStatus[name] || "";
      const next = getNextLevel(current);

      areaStatus[name] = next;
      updateLayerColor(name);
      syncIndividualRadios(name, next);
    },

    mouseover: () => {
      layer.setStyle({ weight: 2, color: "#000" });

      layer.bindTooltip(name, {
        permanent: false,
        direction: "center"
      }).openTooltip();
    },

    mouseout: () => {
      layer.setStyle({ weight: 1, color: "#333" });
      layer.closeTooltip();
    }
  });
}

// =======================
// 五十音グループ
// =======================

function getKanaGroup(namekana) {
  if (!namekana) return "その他";

  const first = namekana[0];

  if ("あいうえお".includes(first)) return "あ行";
  if ("かきくけこがぎぐげご".includes(first)) return "か行";
  if ("さしすせそざじずぜぞ".includes(first)) return "さ行";
  if ("たちつてとだぢづでど".includes(first)) return "た行";
  if ("なにぬねの".includes(first)) return "な行";
  if ("はひふへほばびぶべぼぱぴぷぺぽ".includes(first)) return "は行";
  if ("まみむめも".includes(first)) return "ま行";
  if ("やゆよ".includes(first)) return "や行";
  if ("らりるれろ".includes(first)) return "ら行";
  if ("わをん".includes(first)) return "わ行";

  return "その他";
}

// =======================
// 市町村リスト生成
// =======================
function createKanaList(features) {

  const container = document.getElementById("areaList");
  container.innerHTML = "";

  features.sort((a, b) =>
    a.properties.name.localeCompare(b.properties.name, 'ja')
  );

  const grouped = {};

  features.forEach(f => {
    const name = f.properties.name;
    const kana = f.properties.namekana;
    const group = getKanaGroup(kana);

    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(f);
  });

  const kanaOrder = ["あ行","か行","さ行","た行","な行","は行","ま行","や行","ら行","わ行","その他"];

  kanaOrder.forEach(group => {

    if (!grouped[group]) return;

grouped[group].sort((a, b) =>
  (a.properties.namekana || "").localeCompare(b.properties.namekana || "", 'ja')
);

    const header = document.createElement("h4");
    header.textContent = "▼ " + group;
    header.className = "group-header";
    container.appendChild(header);

  const groupDiv = document.createElement("div");
  groupDiv.className = "group-content";

  container.appendChild(groupDiv);

header.onclick = () => {
  const isClosed = groupDiv.classList.toggle("collapsed");
  header.textContent = (isClosed ? "▶ " : "▼ ") + group;
};

    grouped[group].forEach(f => {

      const name = f.properties.name;

      const div = document.createElement("div");
      div.className = "area-item";

const title = document.createElement("div");
title.className = "area-name";

const kana = f.properties.namekana || "";

// HTMLでふりがな表示
title.innerHTML = `
  <span class="main-name">${name}</span>
  <span class="kana">${kana}</span>
`;

      div.appendChild(title);

      const levels = [
        { label: "なし", value: "" },
        { label: "注意報", value: "advisory" },
        { label: "警報", value: "warning" },
        { label: "危険", value: "danger" },
        { label: "特別", value: "special" }
      ];

      levels.forEach(l => {
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = name;
        radio.value = l.value;

        radio.onchange = () => {
          areaStatus[name] = l.value;
          updateLayerColor(name);
        };

        const label = document.createElement("label");
        label.textContent = l.label;

        div.appendChild(radio);
        div.appendChild(label);
      });

      groupDiv.appendChild(div);
    });

  });
}

// =======================
// グループ操作
// =======================
const areaGroups = {
  "北西部": ["奈良市西部","奈良市東部","生駒市","大和郡山市","天理市","桜井市","香芝市","葛城市","大和高田市","橿原市","御所市","平群町","三郷町","斑鳩町","安堵町","王寺町","河合町","上牧町","川西町","三宅町","広陵町","田原本町","高取町","明日香村"],
  "北東部": ["宇陀市","山添村"],
  "五條・北部吉野": ["五條市北部","大淀町","下市町","吉野町"],
  "南東部": ["東吉野村","黒滝村","川上村","天川村","上北山村","下北山村","曽爾村","御杖村"],
  "南西部": ["五條市南部","十津川村","野迫川村"]
};

function applyGroup(groupName, level) {

  const areas = areaGroups[groupName];

  areas.forEach(name => {
    if (layerMap[name]) {
      areaStatus[name] = level;
      updateLayerColor(name);
      syncIndividualRadios(name, level);
    }
  });
}

// =======================
// グループUI
// =======================
function createGroupControls() {
  const container = document.getElementById("groupList");

  container.innerHTML = "";

  Object.keys(areaGroups).forEach(groupName => {

    const div = document.createElement("div");
    div.className = "group-block";

    const title = document.createElement("h4");
    title.textContent = groupName;
    div.appendChild(title);

    const levels = [
      { label: "なし", value: "" },
      { label: "注意報", value: "advisory" },
      { label: "警報", value: "warning" },
      { label: "危険", value: "danger" },
      { label: "特別", value: "special" }
    ];

    levels.forEach(l => {

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = groupName;
      radio.value = l.value;

      radio.onchange = () => {
        applyGroup(groupName, l.value);
      };

      const label = document.createElement("label");
      label.textContent = l.label;

      div.appendChild(radio);
      div.appendChild(label);
    });

    container.appendChild(div);
  });
}

function saveData() {
  localStorage.setItem("areaStatus", JSON.stringify(areaStatus));
  alert("保存しました");
}

document.getElementById("saveBtn").onclick = saveData;

function resetAll() {
  Object.keys(layerMap).forEach(name => {

    // 状態削除
    areaStatus[name] = "";

    // 色リセット
    updateLayerColor(name);

    // ラジオボタンもリセット
    const radios = document.getElementsByName(name);
    radios.forEach(r => {
      r.checked = (r.value === "");
    });
  });

  // グループラジオも戻す
  Object.keys(areaGroups).forEach(group => {
    const radios = document.getElementsByName(group);
    radios.forEach(r => {
      r.checked = (r.value === "");
    });
  });
}

document.getElementById("resetBtn").onclick = resetAll;

let currentView = "kana";

function createGroupList(features) {
  const container = document.getElementById("areaList");
  container.innerHTML = "";

  Object.keys(areaGroups).forEach(group => {

    const header = document.createElement("h4");
    header.textContent = "▼ " + group;
    header.className = "group-header";

    container.appendChild(header);

    const groupDiv = document.createElement("div");
    groupDiv.className = "group-content";

    container.appendChild(groupDiv);

    header.onclick = () => {
      const isClosed = groupDiv.classList.toggle("collapsed");
      header.textContent = (isClosed ? "▶ " : "▼ ") + group;
    };

    // ✅ 名前で一致するFeatureを探す
    features.forEach(f => {
      const name = f.properties.name;

      if (!areaGroups[group].includes(name)) return;

      const div = document.createElement("div");
      div.className = "area-item";

      const kana = f.properties.namekana || "";

      const title = document.createElement("div");
      title.className = "area-name";

      title.innerHTML = `
        <span class="main-name">${name}</span>
        <span class="kana">${kana}</span>
      `;

      div.appendChild(title);

      const levels = [
        { label: "なし", value: "" },
        { label: "注意報", value: "advisory" },
        { label: "警報", value: "warning" },
        { label: "危険", value: "danger" },
        { label: "特別", value: "special" }
      ];

      levels.forEach(l => {
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = name;
        radio.value = l.value;

        radio.onchange = () => {
          areaStatus[name] = l.value;
          updateLayerColor(name);
        };

        const label = document.createElement("label");
        label.textContent = l.label;

        div.appendChild(radio);
        div.appendChild(label);
      });

      groupDiv.appendChild(div);
    });

  });
}

function renderList(features) {
  if (currentView === "kana") {
    createKanaList(features);
  } else {
    createGroupList(features);
  }
}

document.getElementById("kanaViewBtn").onclick = () => {
  currentView = "kana";
  renderList(currentFeatures);
};

document.getElementById("groupViewBtn").onclick = () => {
  currentView = "group";
  renderList(currentFeatures);
};

let currentFeatures = [];


// =======================
// 読み込み
// =======================
fetch("data/nara.geojson")
  .then(res => res.json())
  .then(data => {

    currentFeatures = data.features;

    const saved = localStorage.getItem("areaStatus");
    if (saved) {
      areaStatus = JSON.parse(saved);
    }

    createGroupControls();

    renderList(currentFeatures);

    L.geoJSON(data, {
      style: () => ({
        color: "#444",
        weight: 1,
        fillColor: "#ffffff",
        fillOpacity: 1
      }),
      onEachFeature: onEachFeature
    }).addTo(map);

    Object.keys(areaStatus).forEach(name => {
      updateLayerColor(name);
      syncIndividualRadios(name, areaStatus[name]);
    });

});