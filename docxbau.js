/* docxbau.js — erzeugt ein Word-Dokument (.docx) im Browser, ohne externe Bibliothek.
   Ein .docx ist ein ZIP mit XML-Teilen. Hier werden die Teile gebaut und ohne
   Komprimierung (Methode 0) gepackt; das ist gültig und kommt ohne Deflate aus.

   Verwendung:
     var blob = docxErzeugen([
       {art:"titel",       text:"Überschrift"},
       {art:"untertitel",  text:"Zeile darunter"},
       {art:"ueberschrift",text:"Abschnitt"},
       {art:"absatz",      text:"Fließtext, \n trennt Absätze"},
       {art:"aufzaehlung", text:"Punkt mit Aufzählungszeichen"},
       {art:"nummeriert",  text:"Punkt mit Nummer"},
       {art:"tabelle",     kopf:["Spalte A","Spalte B"], zeilen:[["a1","b1"],["a2","b2"]]},
       {art:"fussnote",    text:"Kleingedrucktes"}
     ]);
   In Texten wirken **fett** und *kursiv*.
     docxSpeichern(blob, "datei.docx");
*/
(function(global){
  "use strict";

  /* ---------- ZIP ---------- */
  var crcTabelle = (function(){
    var t=new Uint32Array(256);
    for(var i=0;i<256;i++){
      var c=i;
      for(var k=0;k<8;k++) c = (c&1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1);
      t[i]=c>>>0;
    }
    return t;
  })();
  function crc32(bytes){
    var c=0xFFFFFFFF;
    for(var i=0;i<bytes.length;i++) c = crcTabelle[(c ^ bytes[i]) & 0xFF] ^ (c>>>8);
    return (c ^ 0xFFFFFFFF)>>>0;
  }
  function text2bytes(s){ return new TextEncoder().encode(s); }

  function zipBauen(dateien){
    var teile=[], zentral=[], versatz=0;
    var kodierer=new TextEncoder();

    function schreibe32(a,i,v){ a[i]=v&255; a[i+1]=(v>>>8)&255; a[i+2]=(v>>>16)&255; a[i+3]=(v>>>24)&255; }
    function schreibe16(a,i,v){ a[i]=v&255; a[i+1]=(v>>>8)&255; }

    dateien.forEach(function(d){
      var name=kodierer.encode(d.name);
      var inhalt=text2bytes(d.inhalt);
      var pruef=crc32(inhalt);

      var kopf=new Uint8Array(30+name.length);
      schreibe32(kopf,0,0x04034b50);
      schreibe16(kopf,4,20);          // benötigte Version
      schreibe16(kopf,6,0x0800);      // UTF-8 im Namen
      schreibe16(kopf,8,0);           // Methode: gespeichert
      schreibe16(kopf,10,0);          // Zeit
      schreibe16(kopf,12,0x2821);     // Datum (fest, damit Dateien reproduzierbar sind)
      schreibe32(kopf,14,pruef);
      schreibe32(kopf,18,inhalt.length);
      schreibe32(kopf,22,inhalt.length);
      schreibe16(kopf,26,name.length);
      schreibe16(kopf,28,0);
      kopf.set(name,30);

      teile.push(kopf, inhalt);

      var z=new Uint8Array(46+name.length);
      schreibe32(z,0,0x02014b50);
      schreibe16(z,4,20); schreibe16(z,6,20);
      schreibe16(z,8,0x0800); schreibe16(z,10,0);
      schreibe16(z,12,0); schreibe16(z,14,0x2821);
      schreibe32(z,16,pruef);
      schreibe32(z,20,inhalt.length);
      schreibe32(z,24,inhalt.length);
      schreibe16(z,28,name.length);
      schreibe16(z,30,0); schreibe16(z,32,0);
      schreibe16(z,34,0); schreibe16(z,36,0);
      schreibe32(z,38,0);
      schreibe32(z,42,versatz);
      z.set(name,46);
      zentral.push(z);

      versatz += kopf.length + inhalt.length;
    });

    var zentralLaenge=zentral.reduce(function(a,z){ return a+z.length; },0);
    var ende=new Uint8Array(22);
    schreibe32(ende,0,0x06054b50);
    schreibe16(ende,4,0); schreibe16(ende,6,0);
    schreibe16(ende,8,dateien.length);
    schreibe16(ende,10,dateien.length);
    schreibe32(ende,12,zentralLaenge);
    schreibe32(ende,16,versatz);
    schreibe16(ende,20,0);

    return new Blob(teile.concat(zentral, [ende]), {type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  }

  /* ---------- XML ---------- */
  function x(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  }

  var STILE = {
    titel:       {stil:"Titel"},
    untertitel:  {stil:"Untertitel"},
    ueberschrift:{stil:"Ueberschrift"},
    absatz:      {stil:null},
    fussnote:    {stil:"Fussnote"},
    listenpunkt: {stil:"Listenpunkt"},
    aufzaehlung: {stil:"Listenpunkt", liste:1},
    nummeriert:  {stil:"Listenpunkt", liste:2}
  };

  /* Zerlegt einen Text in Läufe. **fett** und *kursiv* werden ausgezeichnet. */
  function laeufeXml(zeile){
    if(zeile==="") return "";
    var teile=String(zeile).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return teile.filter(function(t){ return t!==""; }).map(function(t){
      var fett=/^\*\*[^*]+\*\*$/.test(t);
      var kursiv=!fett && /^\*[^*]+\*$/.test(t);
      var rein = fett ? t.slice(2,-2) : (kursiv ? t.slice(1,-1) : t);
      var rPr = (fett||kursiv) ? '<w:rPr>'+(fett?'<w:b/>':'')+(kursiv?'<w:i/>':'')+'</w:rPr>' : "";
      return '<w:r>'+rPr+'<w:t xml:space="preserve">'+x(rein)+'</w:t></w:r>';
    }).join("");
  }

  function absatzXml(art, zeile){
    var def=STILE[art]||STILE.absatz;
    var pPr="";
    if(def.liste){
      pPr='<w:pPr><w:pStyle w:val="'+def.stil+'"/><w:numPr>'
        + '<w:ilvl w:val="0"/><w:numId w:val="'+def.liste+'"/></w:numPr></w:pPr>';
    } else if(def.stil){
      pPr='<w:pPr><w:pStyle w:val="'+def.stil+'"/></w:pPr>';
    }
    return '<w:p>'+pPr+laeufeXml(zeile)+'</w:p>';
  }

  /* Tabelle: {art:"tabelle", kopf:[...], zeilen:[[...],[...]]} */
  function tabelleXml(block){
    var spalten = (block.kopf && block.kopf.length)
      ? block.kopf.length
      : ((block.zeilen && block.zeilen[0]) ? block.zeilen[0].length : 1);
    var breite = Math.floor(9638/spalten);

    function zelle(inhalt, fett){
      return '<w:tc><w:tcPr><w:tcW w:w="'+breite+'" w:type="dxa"/></w:tcPr>'
        + '<w:p><w:pPr><w:spacing w:after="40"/></w:pPr>'
        + (fett ? '<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">'+x(inhalt)+'</w:t></w:r>'
                : laeufeXml(String(inhalt==null?"":inhalt)))
        + '</w:p></w:tc>';
    }
    var zeilen=[];
    if(block.kopf && block.kopf.length){
      zeilen.push('<w:tr><w:trPr><w:tblHeader/></w:trPr>'
        + block.kopf.map(function(k){ return zelle(k,true); }).join("") + '</w:tr>');
    }
    (block.zeilen||[]).forEach(function(z){
      zeilen.push('<w:tr>'+z.map(function(w){ return zelle(w,false); }).join("")+'</w:tr>');
    });

    return '<w:tbl><w:tblPr><w:tblW w:w="9638" w:type="dxa"/>'
      + '<w:tblBorders>'
      +   ['top','left','bottom','right','insideH','insideV'].map(function(k){
            return '<w:'+k+' w:val="single" w:sz="4" w:space="0" w:color="D3DADE"/>';
          }).join("")
      + '</w:tblBorders>'
      + '<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>'
      + '<w:bottom w:w="60" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>'
      + '</w:tblPr>' + zeilen.join("") + '</w:tbl>'
      + '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>';
  }

  function dokumentXml(bloecke){
    var koerper = bloecke.map(function(b){
      if(b.art==="tabelle") return tabelleXml(b);
      var zeilen = String(b.text==null?"":b.text).split("\n");
      if(zeilen.length===1) return absatzXml(b.art, zeilen[0]);
      return zeilen.map(function(z){ return absatzXml(b.art, z); }).join("");
    }).join("");

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + '<w:body>' + koerper
      + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
      + '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>'
      + '</w:sectPr></w:body></w:document>';
  }

  function stilXml(){
    function stil(id, name, opt){
      return '<w:style w:type="paragraph" w:styleId="'+id+'"><w:name w:val="'+name+'"/>'
        + '<w:basedOn w:val="Standard"/>'
        + '<w:pPr>'
        +   (opt.vor||opt.nach ? '<w:spacing w:before="'+(opt.vor||0)+'" w:after="'+(opt.nach||0)+'"/>' : "")
        +   (opt.rahmen ? '<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="141C24"/></w:pBdr>' : "")
        +   (opt.einzug ? '<w:ind w:left="'+opt.einzug+'"/>' : "")
        + '</w:pPr>'
        + '<w:rPr>'
        +   (opt.fett ? '<w:b/>' : "")
        +   (opt.kursiv ? '<w:i/>' : "")
        +   '<w:color w:val="'+(opt.farbe||"141C24")+'"/>'
        +   '<w:sz w:val="'+(opt.groesse||22)+'"/>'
        + '</w:rPr></w:style>';
    }
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + '<w:docDefaults><w:rPrDefault><w:rPr>'
      +   '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>'
      +   '<w:sz w:val="22"/><w:color w:val="141C24"/>'
      + '</w:rPr></w:rPrDefault>'
      + '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>'
      + '</w:docDefaults>'
      + '<w:style w:type="paragraph" w:default="1" w:styleId="Standard"><w:name w:val="Normal"/></w:style>'
      + stil("Titel","Titel",{fett:true, groesse:34, nach:60})
      + stil("Untertitel","Untertitel",{groesse:19, farbe:"5E6B76", nach:260, rahmen:true})
      + stil("Ueberschrift","Ueberschrift",{fett:true, groesse:24, vor:280, nach:80})
      + stil("Listenpunkt","Listenpunkt",{groesse:22, einzug:360, nach:60})
      + stil("Fussnote","Fussnote",{groesse:16, farbe:"5E6B76", vor:280})
      + '</w:styles>';
  }

  function nummerierungXml(){
    function abstract(id, format, zeichen){
      return '<w:abstractNum w:abstractNumId="'+id+'"><w:lvl w:ilvl="0">'
        + '<w:start w:val="1"/><w:numFmt w:val="'+format+'"/>'
        + '<w:lvlText w:val="'+zeichen+'"/><w:lvlJc w:val="left"/>'
        + '<w:pPr><w:ind w:left="454" w:hanging="284"/></w:pPr>'
        + (format==="bullet" ? '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr>' : "")
        + '</w:lvl></w:abstractNum>';
    }
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + abstract(0,"bullet","\uF0B7")
      + abstract(1,"decimal","%1.")
      + '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>'
      + '<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>'
      + '</w:numbering>';
  }

  function docxErzeugen(bloecke){
    return zipBauen([
      {name:"[Content_Types].xml", inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
        + '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
        + '</Types>'},
      {name:"_rels/.rels", inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        + '</Relationships>'},
      {name:"word/_rels/document.xml.rels", inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'
        + '</Relationships>'},
      {name:"word/document.xml", inhalt:dokumentXml(bloecke)},
      {name:"word/styles.xml", inhalt:stilXml()},
      {name:"word/numbering.xml", inhalt:nummerierungXml()}
    ]);
  }

  function docxSpeichern(blob, name){
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); },1000);
  }

  global.docxErzeugen=docxErzeugen;
  global.docxSpeichern=docxSpeichern;
})(typeof window!=="undefined" ? window : globalThis);
