import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const firebaseConfig = {
  apiKey: "AIzaSyDxFkjX3aW_fUqe6VCFbcu7Uv4_2nd6fqk",
  authDomain: "escala-gpm.firebaseapp.com",
  projectId: "escala-gpm",
  storageBucket: "escala-gpm.firebasestorage.app",
  messagingSenderId: "540549661641",
  appId: "1:540549661641:web:3dc4fe875e09f603659e18",
  measurementId: "G-0DDKB7DJ9S"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const App = () => {
  const [autenticado, setAutenticado] = useState(false);
  const [policialLogado, setPolicialLogado] = useState("");
  const [cpfDigitado, setCpfDigitado] = useState("");
  const [mes, setMes] = useState(new Date().getMonth());
  const [escala, setEscala] = useState({});
  const [ferias, setFerias] = useState({});
  const [determinacoes, setDeterminacoes] = useState("");
  const [centes, setCientes] = useState([]);
  const [determinacoesNaoLidas, setDeterminacoesNaoLidas] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("GERAL");
  const [modoComandante, setModoComandante] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const [relatoOcorrencia, setRelatoOcorrencia] = useState("");
  const [nomeVitima, setNomeVitima] = useState("");
  const [nomeAcusado, setNomeAcusado] = useState("");
  const [crimes, setCrimes] = useState([]);
  const [outroCrime, setOutroCrime] = useState("");
  
  const [permutaInfo, setPermutaInfo] = useState({ dataServico: "", substituto: "", outroSubstituto: "", dataContrapartida: "" });
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [diaEditando, setDiaEditando] = useState(null);
  const [tipoEditando, setTipoEditando] = useState("");
  const [textoPermutaRapida, setTextoPermutaRapida] = useState("");
  const [observacoes, setObservacoes] = useState({});
  const [obsAberta, setObsAberta] = useState(null);

  const [modalPermutaClique, setModalPermutaClique] = useState(false);
  const [policialSelecionado, setPolicialSelecionado] = useState(null);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [tipoSelecionado, setTipoSelecionado] = useState(null);

  const senhaCorreta = "1234";
  const meuNome = "3ºSgt Rilton";
  const todosPoliciais = [meuNome, "3ºSgt Nielsen", "3ºSgt Cabral", "Cb Lima", "Cb Liberato", "Cb Moreno", "Cb Fábio"];

  const ordemAntiguidade = [meuNome, "3ºSgt Nielsen", "3ºSgt Cabral", "Cb Lima", "Cb Liberato", "Cb Moreno", "Cb Fábio"];
  
  const ordenarPorAntiguidade = (lista) => {
    return [...lista].sort((a, b) => {
      const indexA = ordemAntiguidade.indexOf(a);
      const indexB = ordemAntiguidade.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };
  
  const cpfs = {
    "3ºSgt Rilton": "961.701.663-04", "3ºSgt Nielsen": "813.606.223-49",
    "3ºSgt Cabral": "022.290.293-04", "Cb Lima": "914.240.463.00", "Cb Fábio": "026.923.453-55",
    "Cb Liberato": "040.195.353-02", "Cb Moreno": "024.256.853-08"
  };

  const mesesNome = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const diasSemanaLong = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  const azulPmpi = "#003366";
  const amareloPmpi = "#FFCC00";

  // 📅 TABELA DE FÉRIAS 2026
  const feriasProgramadas = {
    "3ºSgt Rilton": [{ inicio: "2026-03-01", fim: "2026-03-30" }],
    "3ºSgt Nielsen": [{ inicio: "2026-12-01", fim: "2026-12-30" }],
    "3ºSgt Cabral": [{ inicio: "2026-08-01", fim: "2026-08-30" }],
    "Cb Liberato": [{ inicio: "2026-01-01", fim: "2026-01-30" }],
    "Cb Lima": [{ inicio: "2026-07-01", fim: "2026-07-30" }, { inicio: "2026-11-01", fim: "2026-11-30" }],
    "Cb Moreno": [{ inicio: "2026-04-01", fim: "2026-04-30" }, { inicio: "2026-06-01", fim: "2026-06-30" }],
    "Cb Fábio": [{ inicio: "2026-03-01", fim: "2026-03-15" }, { inicio: "2026-05-01", fim: "2026-05-30" }]
  };

  const estaDeFerias = (policial, mes, dia) => {
    const data = new Date(2026, mes, dia);
    const periodos = feriasProgramadas[policial] || [];
    return periodos.some(p => {
      const inicio = new Date(p.inicio);
      const fim = new Date(p.fim);
      return data >= inicio && data <= fim;
    });
  };

  useEffect(() => {
    const sessaoSalva = localStorage.getItem("gpm_session");
    if (sessaoSalva) {
      const dados = JSON.parse(sessaoSalva);
      if (new Date().getTime() < dados.expiracao) { 
        setPolicialLogado(dados.nome); 
        setAutenticado(true); 
      }
    }
    const escalaRef = ref(db, 'escala_oficial/');
    const unsubscribe = onValue(escalaRef, (snapshot) => {
      if (modoComandante) return; 
      const dados = snapshot.val();
      if (dados) { 
        setEscala(dados.escala || {}); 
        setFerias(dados.ferias || {}); 
        setDeterminacoes(dados.determinacoes || ""); 
        setCientes(dados.cientes || []);
        if (dados.determinacoes && dados.determinacoes !== "" && !dados.cientes?.includes(policialLogado)) {
          setDeterminacoesNaoLidas(true);
        } else {
          setDeterminacoesNaoLidas(false);
        }
      }
    });
    return () => unsubscribe();
  }, [modoComandante, policialLogado]);

  const handleLogin = (e) => {
    e.preventDefault();
    const cpfLimpo = cpfDigitado.replace(/\D/g, "");
    const nomeEncontrado = Object.keys(cpfs).find(n => cpfs[n].replace(/\D/g, "") === cpfLimpo);
    if (nomeEncontrado) {
      localStorage.setItem("gpm_session", JSON.stringify({ nome: nomeEncontrado, expiracao: new Date().getTime() + 86400000 }));
      setPolicialLogado(nomeEncontrado); 
      setAutenticado(true);
    } else alert("CPF não reconhecido.");
  };

  const handleLogout = () => { 
    localStorage.removeItem("gpm_session"); 
    setAutenticado(false); 
    setPolicialLogado(""); 
    setModoComandante(false); 
    setAbaAtiva("GERAL"); 
  };

    const tocarSom = () => {
    try {
      const audio = new Audio("/alerta.mp3");
      audio.play();
    } catch (e) {
      // Som não disponível
    }
  };

    const publicarAlteracoes = () => {
    if (!window.confirm("Deseja publicar essas alterações para toda a tropa?")) return;
    const dadosParaSalvar = { escala: escala, ferias: ferias, determinacoes: determinacoes, cientes: centes };
    update(ref(db, 'escala_oficial/'), dadosParaSalvar)
    .then(() => {
        tocarSom();
        alert("Alterações salvas com sucesso! A tropa já pode visualizar.");
        localStorage.removeItem("rascunho_escala");
        localStorage.removeItem("rascunho_ferias");
        setModoComandante(false); 
    })
    .catch((err) => alert("Erro ao salvar: " + err));
  };

  const togglePolicialNaEscala = (pNome) => {
    const chaveD = mes + "_" + diaEditando;
    const novaEscala = { ...escala };
    if (!novaEscala[chaveD]) novaEscala[chaveD] = { pm: [], reforco: [] };
    if (!novaEscala[chaveD][tipoEditando]) novaEscala[chaveD][tipoEditando] = [];
    if (novaEscala[chaveD][tipoEditando].includes(pNome)) {
      novaEscala[chaveD][tipoEditando] = novaEscala[chaveD][tipoEditando].filter(n => n !== pNome);
    } else { 
      novaEscala[chaveD][tipoEditando].push(pNome);
      novaEscala[chaveD][tipoEditando] = ordenarPorAntiguidade(novaEscala[chaveD][tipoEditando]);
    }
    setEscala(novaEscala);
    if (modoComandante) localStorage.setItem("rascunho_escala", JSON.stringify(novaEscala));
  };

  const abrirModalPermutaClique = (policial, dia, tipo) => {
    if (!modoComandante) return;
    setPolicialSelecionado(policial);
    setDiaSelecionado(dia);
    setTipoSelecionado(tipo);
    setModalPermutaClique(true);
  };

  const confirmarPermutaClique = (substituto) => {
    const chaveD = mes + "_" + diaSelecionado;
    const novaEscala = { ...escala };
    if (!novaEscala[chaveD]) novaEscala[chaveD] = { pm: [], reforco: [] };
    if (!novaEscala[chaveD].permutas) novaEscala[chaveD].permutas = {};
    novaEscala[chaveD].permutas[policialSelecionado] = substituto;
    setEscala(novaEscala);
    if (modoComandante) localStorage.setItem("rascunho_escala", JSON.stringify(novaEscala));
    setModalPermutaClique(false);
  };

  const removerPermutaClique = () => {
    const chaveD = mes + "_" + diaSelecionado;
    const novaEscala = { ...escala };
    if (novaEscala[chaveD]?.permutas) {
      delete novaEscala[chaveD].permutas[policialSelecionado];
      if (Object.keys(novaEscala[chaveD].permutas).length === 0) {
        delete novaEscala[chaveD].permutas;
      }
    }
    setEscala(novaEscala);
    if (modoComandante) localStorage.setItem("rascunho_escala", JSON.stringify(novaEscala));
    setModalPermutaClique(false);
  };

  const getPoliciaisComPermutas = (dia, tipo) => {
    const chaveD = mes + "_" + dia;
    const policiais = escala[chaveD]?.[tipo] || [];
    const permutas = escala[chaveD]?.permutas || {};
    const resultado = policiais.map(p => permutas[p] || p);
    return ordenarPorAntiguidade(resultado);
  };

  const temPermuta = (policial, dia) => {
    const chaveD = mes + "_" + dia;
    return escala[chaveD]?.permutas?.[policial] || null;
  };

  const salvarTextoPermuta = () => {
    const chaveD = mes + "_" + diaEditando;
    const novaEscala = { ...escala };
    if (!novaEscala[chaveD]) novaEscala[chaveD] = { pm: [], reforco: [] };
    novaEscala[chaveD].infoPermuta = textoPermutaRapida;
    setEscala(novaEscala);
    if (modoComandante) localStorage.setItem("rascunho_escala", JSON.stringify(novaEscala));
  };

  const salvarObservacao = (dia) => {
    const chaveD = mes + "_" + dia;
    const novaEscala = { ...escala };
    if (!novaEscala[chaveD]) novaEscala[chaveD] = { pm: [], reforco: [] };
    novaEscala[chaveD].observacao = observacoes[dia] || "";
    setEscala(novaEscala);
    setObsAberta(null);
    if (modoComandante) localStorage.setItem("rascunho_escala", JSON.stringify(novaEscala));
  };

  const abrirSeletor = (dia, tipo) => { 
    if (modoComandante) { 
      setDiaEditando(dia); 
      setTipoEditando(tipo); 
      setTextoPermutaRapida(escala[mes + "_" + dia]?.infoPermuta || "");
      setSeletorAberto(true); 
    } 
  };

  const alternarFerias = (p) => { 
    if (!modoComandante) return; 
    const mF = ferias[mes] || []; 
    const nF = mF.includes(p) ? mF.filter(x => x !== p) : [...mF, p]; 
    const novasFerias = { ...ferias, [mes]: nF };
    setFerias(novasFerias);
    localStorage.setItem("rascunho_ferias", JSON.stringify(novasFerias));
  };

  const contarServicos = (policial) => {
    let contador = 0;
    const diasNoMes = new Date(2026, mes + 1, 0).getDate();
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const chave = mes + "_" + dia;
      const pm = escala[chave]?.pm || [];
      const reforco = escala[chave]?.reforco || [];
      if (pm.includes(policial) || reforco.includes(policial)) contador++;
    }
    return contador;
  };

        // 🤖 GERAR ESCALA AUTOMÁTICA (1x3 - VERSÃO FINAL)
  const gerarEscalaAutomatica = () => {
    if (!window.confirm("Isso vai gerar a escala de " + mesesNome[mes] + " seguindo o padrão 1x3. Continuar?")) return;
    
    const diasNoMes = new Date(2026, mes + 1, 0).getDate();
    const novaEscala = { ...escala };
    
    const mesAnterior = mes === 0 ? 11 : mes - 1;
    const diasMesAnterior = new Date(2026, mesAnterior + 1, 0).getDate();
    
    // Quantos dias copiar do mês anterior (no máximo 4)
    const diasTransicao = Math.min(diasMesAnterior, 4);
    const diaInicioMesAnterior = diasMesAnterior - diasTransicao + 1;
    
    // PASSO 1: Copiar últimos dias do mês anterior para primeiros dias do mês atual
    for (let i = 0; i < diasTransicao; i++) {
      const diaMesAnterior = diaInicioMesAnterior + i;
      const diaMesAtual = i + 1;
      
      const chaveAnterior = mesAnterior + "_" + diaMesAnterior;
      const chaveAtual = mes + "_" + diaMesAtual;
      
      const plantaoAnterior = escala[chaveAnterior]?.pm || [];
      const plantaoCopiado = plantaoAnterior.filter(p => p !== meuNome);
      
      if (!novaEscala[chaveAtual]) novaEscala[chaveAtual] = { pm: [], reforco: [] };
      novaEscala[chaveAtual].pm = [...plantaoCopiado];
    }
    
    // PASSO 2: Adicionar policiais que VOLTARAM de férias no dia 1
    // (estavam de férias no último dia do mês anterior, mas NÃO estão no dia 1)
    const todosPoliciasExcetoCMT = ordemAntiguidade.filter(p => p !== meuNome);
    
    todosPoliciasExcetoCMT.forEach(p => {
      const estavaDeFerias = estaDeFerias(p, mesAnterior, diasMesAnterior);
      const estaDeFeriasAgora = estaDeFerias(p, mes, 1);
      
      if (estavaDeFerias && !estaDeFeriasAgora) {
        // Voltou de férias! Adiciona no dia 1
        const chaveDia1 = mes + "_1";
        if (!novaEscala[chaveDia1]) novaEscala[chaveDia1] = { pm: [], reforco: [] };
        if (!novaEscala[chaveDia1].pm.includes(p)) {
          novaEscala[chaveDia1].pm.push(p);
        }
      }
    });
    
    // PASSO 3: Remover policiais que estão de férias em cada dia
    for (let dia = 1; dia <= diasTransicao; dia++) {
      const chave = mes + "_" + dia;
      if (novaEscala[chave] && novaEscala[chave].pm) {
        novaEscala[chave].pm = novaEscala[chave].pm.filter(p => !estaDeFerias(p, mes, dia));
      }
    }
    
    // Ordena os primeiros dias
    for (let dia = 1; dia <= diasTransicao; dia++) {
      const chave = mes + "_" + dia;
      if (novaEscala[chave] && novaEscala[chave].pm) {
        novaEscala[chave].pm = ordenarPorAntiguidade(novaEscala[chave].pm);
      }
    }
    
    // PASSO 4: Preencher do dia 5 em diante com padrão 1x3
    for (let dia = 5; dia <= diasNoMes; dia++) {
      const diaOrigem = dia - 4;
      const chaveOrigem = mes + "_" + diaOrigem;
      const chaveDestino = mes + "_" + dia;
      
      if (!novaEscala[chaveOrigem]) continue;
      
      const policiaisOrigem = novaEscala[chaveOrigem].pm || [];
      const policiaisDoDia = policiaisOrigem.filter(p => !estaDeFerias(p, mes, dia));
      
      if (!novaEscala[chaveDestino]) novaEscala[chaveDestino] = { pm: [], reforco: [] };
      novaEscala[chaveDestino].pm = [...policiaisDoDia];
    }
    
    // PASSO 5: Férias que terminam dia 30 em mês de 31 dias -> trabalha dia 31
    todosPoliciasExcetoCMT.forEach(p => {
      const periodos = feriasProgramadas[p] || [];
      periodos.forEach(periodo => {
        const fim = new Date(periodo.fim);
        if (fim.getMonth() === mes && fim.getDate() === 30 && diasNoMes === 31) {
          const chaveDia31 = mes + "_31";
          if (!novaEscala[chaveDia31]) novaEscala[chaveDia31] = { pm: [], reforco: [] };
          if (!novaEscala[chaveDia31].pm.includes(p)) {
            novaEscala[chaveDia31].pm.push(p);
            novaEscala[chaveDia31].pm = ordenarPorAntiguidade(novaEscala[chaveDia31].pm);
          }
        }
      });
    });
    
    setEscala(novaEscala);
    localStorage.setItem("rascunho_escala", JSON.stringify(novaEscala));
    alert("Escala de " + mesesNome[mes] + " gerada com sucesso! Padrão 1x3.");
  };
  
  const diaHoje = new Date().getDate();
  const mesHoje = new Date().getMonth();
  
  const policiaisHoje = getPoliciaisComPermutas(diaHoje, 'pm').concat(getPoliciaisComPermutas(diaHoje, 'reforco'));
  const deServicoHoje = policiaisHoje.includes(policialLogado);
  const podeAcessarComposicao = deServicoHoje || policialLogado === meuNome;

  const gerarPDFEscalaOficial = () => {
    const doc = new jsPDF();
    try { doc.addImage("/brasao_pmpi_pdf.png", "PNG", 15, 10, 20, 20); doc.addImage("/brasao_gpm_pdf.png", "PNG", 175, 10, 20, 20); } catch (e) {}
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("POLÍCIA MILITAR DO PIAUÍ", 105, 15, { align: "center" });
    doc.text("COMANDO DE POLICIAMENTO DO LITORAL MEIO-NORTE - CPLMN", 105, 20, { align: "center" });
    doc.text("2ªCIA/15º BPM - BATALHÃO HERÓIS DO JENIPAPO", 105, 25, { align: "center" });
    doc.text("GPM DE BURITI DOS MONTES", 105, 30, { align: "center" });
    doc.setFontSize(11);
    doc.text("Escala de serviço do mês de " + mesesNome[mes].toUpperCase() + " de 2026", 105, 45, { align: "center" });
    const head = [['DIA', 'DIAS DA SEMANA', 'PMs DE PLANTÃO', 'REFORÇO - ESCALA EXTRA', 'OBS:']];
    const body = [];
    for (let d = 1; d <= new Date(2026, mes + 1, 0).getDate(); d++) {
      const chave = mes + "_" + d; 
      const dataObj = new Date(2026, mes, d);
      const temComandante = escala[chave]?.pm?.includes(meuNome) || escala[chave]?.reforco?.includes(meuNome);
      const plantaoLimpo = escala[chave]?.pm?.filter(p => p !== meuNome).join("/ ") || "";
      const reforcoLimpo = escala[chave]?.reforco?.filter(p => p !== meuNome).join("/ ") || "";
      body.push([d.toString().padStart(2, '0'), diasSemanaLong[dataObj.getDay()], plantaoLimpo, reforcoLimpo, temComandante ? "3ºSGT RILTON" : ""]);
    }
        doc.autoTable({
      head, body, startY: 50, theme: 'grid', 
      styles: { 
        fontSize: 7.5, 
        halign: 'center', 
        textColor: [0, 0, 0], 
        cellPadding: 1,
        lineWidth: 0.2,        // Linhas mais grossas
        lineColor: [0, 0, 0]   // Linhas PRETAS (mais escuras)
      },
      headStyles: { 
        fillColor: [0, 51, 102],    // Fundo AZUL escuro
        textColor: [255, 255, 255], // Texto BRANCO
        lineWidth: 0.2, 
        fontStyle: 'bold' 
      },
      didParseCell: (data) => { 
        if (data.column.index === 1 && (data.cell.raw.includes("Sexta") || data.cell.raw.includes("Sábado") || data.cell.raw.includes("Domingo"))) data.cell.styles.textColor = [255, 0, 0]; 
        if (data.column.index === 3 && data.cell.raw !== "") data.cell.styles.textColor = [255, 0, 0]; 
      },
      columnStyles: { 1: { halign: 'left' }, 2: { halign: 'left' }, 3: { halign: 'left' } }
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal");
    doc.text("Obs: Escala sujeita a alterações conforme a necessidade do serviço.", 15, finalY);
    doc.text("Sobreaviso: 3º SGT RILTON (Cmt do GPM)", 15, finalY + 4);
    doc.text("Férias: " + (ferias[mes] ? ferias[mes].join(", ") : "Nenhum"), 15, finalY + 8);
    doc.text("Gpm de Buriti dos Montes- PI, na data da assinatura digital.", 195, finalY + 16, { align: "right" }); 
    doc.setFont("helvetica", "bold"); doc.text("____________________________________", 105, finalY + 35, { align: "center" });
    doc.text("RILTON LIMA BESERRA – 3º SGT PM", 105, finalY + 40, { align: "center" });
    doc.text("CMT do GPM de Buriti do Montes", 105, finalY + 45, { align: "center" });
    doc.save("Escala_de_Serviço_" + mesesNome[mes] + "_2026.pdf");
  };

  const gerarComposicaoWhatsApp = () => { 
    if (!podeAcessarComposicao) { alert("ACESSO NEGADO: Apenas policiais de serviço hoje podem enviar a composição."); return; }
    const h = new Date(); 
    const dH = h.getDate().toString().padStart(2, '0') + "/" + (h.getMonth() + 1).toString().padStart(2, '0') + "/" + h.getFullYear(); 
    const amanha = new Date(h); amanha.setDate(h.getDate() + 1);
    const dA = amanha.getDate().toString().padStart(2, '0') + "/" + (amanha.getMonth() + 1).toString().padStart(2, '0') + "/" + amanha.getFullYear();
    const policiaisPM = getPoliciaisComPermutas(h.getDate(), 'pm');
    const policiaisReforco = getPoliciaisComPermutas(h.getDate(), 'reforco');
    let lista = ""; 
    policiaisPM.forEach(p => lista += "\n" + p + "\nCPF: " + (cpfs[p] || "---") + "\n"); 
    policiaisReforco.forEach(p => lista += "\n" + p + " (Reforço)\nCPF: " + (cpfs[p] || "---") + "\n"); 
    const t = "*GPM Buriti dos Montes*\nEscala de serviço " + dH + "\n" + lista + "\nDas 8:00h do dia " + dH + " às 8:00h do dia " + dA + "."; 
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(t), '_blank'); 
  };

  const gerarRelatorioWhatsApp = () => { 
    const h = new Date(); 
    const dH = h.getDate().toString().padStart(2, '0') + "/" + (h.getMonth()+1).toString().padStart(2,'0') + "/" + h.getFullYear(); 
    const policiaisPM = getPoliciaisComPermutas(h.getDate(), 'pm');
    const policiaisReforco = getPoliciaisComPermutas(h.getDate(), 'reforco');
    const guarnicao = policiaisPM.join('\n') || "---"; 
    const reforco = policiaisReforco.length > 0 ? "\n*Reforço:* " + policiaisReforco.join(', ') : "";
    let t = "*POLÍCIA MILITAR DO PIAUÍ*\n*COMANDO DE POLICIAMENTO DO LITORAL MEIO NORTE - CPLMN*\n*15°BPM - BATALHÃO HERÓIS DO JENIPAPO*\n*CAMPO MAIOR*\n*COMANDANTE DO 15°BPM: TC REGINALDO COSTA*\n*SUB COMANDANTE*\n*MAJOR CRUZ*\n\n*2° CIA 15BPM*\n*CMT 2° TEN QOPM GUYLHERME*\n*SUB CMT - 2° TEN F GOMES*\n\n*GPM BURITI DOS MONTES*\n\n*Dia* " + dH + "\n\n*Efetivo:*\n" + guarnicao + reforco + "\n\n";
    if (crimes.length > 0) {
  const crimesFormatados = crimes.map(c => c === "OUTRO" ? outroCrime : c).filter(c => c !== "");
  if (crimesFormatados.length > 0) {
    t += "*Crime(s):* " + crimesFormatados.join(", ") + "\n";
  }
}
    if(nomeVitima) t += "*Vítima:* " + nomeVitima + "\n";
    if(nomeAcusado) t += "*Acusado:* " + nomeAcusado + "\n\n";
    t += "*Ocorrência:*\n" + relatoOcorrencia + "\n\n*SERVIR E PROTEGER*";
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(t), '_blank'); 
  };

  const gerarPDFPermuta = () => {
    const doc = new jsPDF();
    const dDoc = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const nomeSubstituto = permutaInfo.substituto === "OUTRO" ? permutaInfo.outroSubstituto : permutaInfo.substituto;
    doc.setFont("helvetica", "bold");
    doc.text("POLÍCIA MILITAR DO PIAUÍ", 105, 20, { align: "center" });
    doc.text("COMANDO DE POLICIAMENTO DO LITORAL MEIO-NORTE - CPLMN", 105, 27, { align: "center" });
    doc.text("2ª CIA/15° BPM - GPM DE BURITI DOS MONTES", 105, 41, { align: "center" });
    doc.setFont("helvetica", "normal"); 
    doc.text("Ao 3º Sargento RILTON", 20, 60); 
    doc.text("Comandante do GPM de Buriti dos Montes", 20, 67); 
    doc.text("Do: " + policialLogado, 20, 80); 
    doc.text("Assunto: Solicitação de permuta de serviço.", 20, 87);
    const contra = permutaInfo.dataContrapartida ? ". Em contrapartida comprometo-me a compensar o serviço no dia " + permutaInfo.dataContrapartida + "." : ".";
    const texto = "Ao tempo em que cumprimento Vossa Senhoria, solicito autorização para permuta de serviço no dia " + permutaInfo.dataServico + " ficando o " + nomeSubstituto + ", como meu substituto legal" + contra + " Declaro estar ciente das responsabilidades decorrentes da permuta e asseguro que não haverá prejuízo ao serviço.";
    doc.text(doc.splitTextToSize(texto, 170), 20, 100);
    doc.text("Buriti dos Montes-PI, " + dDoc + ".", 20, 140);
    doc.text("___________________________", 20, 170); doc.text("Substituído: " + policialLogado, 20, 177);
    doc.text("___________________________", 120, 170); doc.text("Substituto: " + nomeSubstituto, 120, 177);
    doc.setFont("helvetica", "bold"); doc.text("AUTORIZO:", 105, 210, { align: "center" });
    doc.text("_______________________________________________", 105, 230, { align: "center" }); 
    doc.text("RILTON LIMA BESERRA - 3º SGT PM", 105, 237, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.text("CMT do GPM de Buriti do Montes", 105, 244, { align: "center" });
    doc.save("Permuta_" + policialLogado + ".pdf");
  };

  const s = { bg: darkMode ? "#121212" : "#f0f2f5", card: darkMode ? "#1e1e1e" : "#fff", txt: darkMode ? "#fff" : "#333", header: azulPmpi };
    if (!autenticado) return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: s.bg, color: s.txt, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div style={{ backgroundColor: s.card, padding: "40px", borderRadius: "20px", textAlign: "center", width: "100%", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        <img src="/logo_gpm.png" alt="Logo" style={{ width: "90px", marginBottom: "20px" }} />
        <h2 style={{ color: azulPmpi }}>GPM BURITI DOS MONTES</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Digite seu CPF" value={cpfDigitado} onChange={(e) => setCpfDigitado(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "15px", textAlign: "center" }} />
          <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: azulPmpi, color: "white", border: "none", borderRadius: "10px", fontWeight: "bold" }}>ENTRAR</button>
        </form>
      </div>
    </div>
  );

        const diasParaExibir = Array.from({ length: new Date(2026, mes + 1, 0).getDate() }, (_, i) => i + 1).filter(dia => {
    if (abaAtiva === "GERAL" || abaAtiva === "FÉRIAS") return true;
    const chaveD = mes + "_" + dia;
    const permutas = escala[chaveD]?.permutas || {};
    
    // Verifica se o policial está nos PMs OU no Reforço
    const nosPMs = escala[chaveD]?.pm?.includes(abaAtiva);
    const noReforco = escala[chaveD]?.reforco?.includes(abaAtiva);
    
    // Se ele está escalado E NÃO foi substituído (não é chave de permuta)
    if (nosPMs && !permutas[abaAtiva]) return true;
    if (noReforco && !permutas[abaAtiva]) return true;
    
    // Se ele NÃO está escalado mas É SUBSTITUTO de alguém (está cobrindo)
    if (!nosPMs && !noReforco && Object.values(permutas).includes(abaAtiva)) return true;
    
    return false;
  });

    return (
    <>
      <style>{`
        @keyframes piscar {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div style={{ fontFamily: "sans-serif", backgroundColor: s.bg, color: s.txt, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* MODAL DE PERMUTA COM UM CLIQUE */}
      {modalPermutaClique && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1001, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: s.card, padding: "25px", borderRadius: "15px", width: "90%", maxWidth: "400px" }}>
            <h4 style={{ textAlign: "center", marginBottom: "15px", color: azulPmpi }}>PERMUTA - {policialSelecionado}</h4>
            <p style={{ textAlign: "center", marginBottom: "20px" }}>Selecione o substituto para o dia {diaSelecionado}:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
              {todosPoliciais.filter(p => p !== policialSelecionado).map(p => (
                <button key={p} onClick={() => confirmarPermutaClique(p)} style={{ padding: "12px", borderRadius: "8px", border: "none", backgroundColor: azulPmpi, color: "white", fontWeight: "bold", cursor: "pointer" }}>{p}</button>
              ))}
            </div>
            {temPermuta(policialSelecionado, diaSelecionado) && (
              <button onClick={removerPermutaClique} style={{ marginTop: "15px", width: "100%", padding: "12px", backgroundColor: "#ff9800", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>🗑️ REMOVER PERMUTA (VOLTAR AO ORIGINAL)</button>
            )}
            <button onClick={() => setModalPermutaClique(false)} style={{ marginTop: "15px", width: "100%", padding: "12px", backgroundColor: "#d32f2f", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>CANCELAR</button>
          </div>
        </div>
      )}

      {seletorAberto && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: s.card, padding: "25px", borderRadius: "15px", width: "90%", maxWidth: "400px" }}>
            <h4 style={{ textAlign: "center", marginBottom: "15px", color: azulPmpi }}>ESCALAR POLICIAL</h4>
            <div style={{ marginBottom: "15px", padding: "10px", border: "1px solid " + amareloPmpi, borderRadius: "8px" }}>
               <label style={{fontSize: '0.7rem', fontWeight: 'bold'}}>Policiais reforçando os eventos: </label>
               <input type="text" value={textoPermutaRapida} onChange={(e) => setTextoPermutaRapida(e.target.value)} onBlur={salvarTextoPermuta} style={{width: '100%', padding: '8px', marginTop: '5px'}} placeholder="Quem entra no lugar de quem?" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {todosPoliciais.map(p => (
                <button key={p} onClick={() => togglePolicialNaEscala(p)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: escala[mes + "_" + diaEditando]?.[tipoEditando]?.includes(p) ? azulPmpi : "transparent", color: escala[mes + "_" + diaEditando]?.[tipoEditando]?.includes(p) ? amareloPmpi : s.txt, fontWeight: "bold" }}>{p}</button>
              ))}
            </div>
            <button onClick={() => setSeletorAberto(false)} style={{ marginTop: "20px", width: "100%", padding: "12px", backgroundColor: "#d32f2f", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>CONCLUÍDO</button>
          </div>
        </div>
      )}

      <header style={{ backgroundColor: azulPmpi, borderBottom: "5px solid " + amareloPmpi, color: "white", padding: "20px", textAlign: "center", position: "relative", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px" }}>
          <img src="/logo_gpm.png" alt="Logo" style={{ width: "50px" }} />
          <h2 style={{ margin: 0 }}>GPM BURITI DOS MONTES</h2>
        </div>
        <div style={{ position: "absolute", right: "10px", top: "5px", display: "flex", gap: "5px" }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "6px", borderRadius: "50%" }}>{darkMode ? "☀️" : "🌙"}</button>
          {policialLogado === meuNome && (
            <button onClick={() => modoComandante ? setModoComandante(false) : (prompt("Senha CMD:") === senhaCorreta && setModoComandante(true))} style={{ backgroundColor: modoComandante ? amareloPmpi : "white", color: azulPmpi, border: "none", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", fontSize: "0.7rem" }}>{modoComandante ? "SAIR CMD" : "CMD"}</button>
          )}
        </div>
      </header>

      <div style={{ backgroundColor: darkMode ? "#1a237e" : "#e8eaf6", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: "bold" }}>👋 Bem-vindo, {policialLogado === meuNome ? <span style={{color: "#0d47a1"}}>{policialLogado}</span> : policialLogado}</span>
        <button onClick={handleLogout} style={{ background: azulPmpi, border: "none", color: "#fff", borderRadius: "5px", padding: "4px 10px", fontSize: "0.7rem" }}>🚪 SAIR</button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", padding: "8px", flexWrap: "wrap" }}>
        <a href="https://sicadpmpi.sistemasweb.site" target="_blank" rel="noreferrer" style={{ color: azulPmpi, fontWeight: "bold", textDecoration: "none", fontSize: "0.75rem" }}>🔗 SICAD</a>
        <a href="https://seguranca.sinesp.gov.br/sinesp-seguranca/login.jsf" target="_blank" rel="noreferrer" style={{ color: "#2e7d32", fontWeight: "bold", textDecoration: "none", fontSize: "0.75rem" }}>🚔 SINESP</a>
        <a href="https://t.me/lupaapi_bot" target="_blank" rel="noreferrer" style={{ color: "#0088cc", fontWeight: "bold", textDecoration: "none", fontSize: "0.75rem" }}>💬 LUPA BOT</a>
      </div>

      <div style={{ maxWidth: "100%", margin: "auto", padding: "5px", flex: 1, width: "100%", overflowX: "hidden" }}>
        
        {/* DETERMINAÇÕES */}
        <div style={{ backgroundColor: "#fff3e0", padding: "20px", borderRadius: "10px", marginBottom: "15px", border: "2px solid #d32f2f", borderLeft: "8px solid #d32f2f", boxShadow: "0 4px 15px rgba(211,47,47,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#d32f2f" }}>
              ⚠️ DETERMINAÇÕES
              {determinacoesNaoLidas && (
                <span style={{ backgroundColor: "#d32f2f", color: "white", fontSize: "11px", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold" }}>NOVA</span>
              )}
            </h4>
            {!modoComandante && abaAtiva !== "GERAL" && (
              <button onClick={() => !centes.includes(abaAtiva) && update(ref(db, 'escala_oficial/'), { escala, ferias, determinacoes, cientes: [...centes, abaAtiva] })} style={{ backgroundColor: centes.includes(abaAtiva) ? "#ccc" : "#2e7d32", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px" }}>{centes.includes(abaAtiva) ? "CIENTE ✓" : "DAR CIENTE"}</button>
            )}
          </div>
          {modoComandante ? <textarea style={{ width: "100%", height: "80px", marginTop: "10px", padding: "10px", borderRadius: "5px", border: "1px solid #d32f2f" }} value={determinacoes} onChange={(e) => setDeterminacoes(e.target.value)} /> : <div style={{ whiteSpace: "pre-wrap", marginTop: "10px", padding: "10px", backgroundColor: "#fff", borderRadius: "5px", borderLeft: "5px solid #d32f2f", color: "#333" }}>{determinacoes || "Sem ordens."}</div>}
        </div>

        {/* RESUMO RÁPIDO DO DIA */}
        <div style={{ backgroundColor: s.card, padding: "10px", borderRadius: "10px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "4px solid " + azulPmpi, fontSize: "13px" }}>
          <strong style={{ color: azulPmpi }}>📋 GUARNIÇÃO DE HOJE - DIA {diaHoje}</strong>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px", textAlign: "center" }}>
            <div style={{ flex: 1 }}><span style={{ fontSize: "11px", color: "#888" }}>👮 Plantão</span><br/><strong style={{ fontSize: "16px", color: azulPmpi }}>{getPoliciaisComPermutas(diaHoje, 'pm').length}</strong></div>
            <div style={{ flex: 1 }}><span style={{ fontSize: "11px", color: "#888" }}>🛡️ Reforço</span><br/><strong style={{ fontSize: "16px", color: "#d32f2f" }}>{getPoliciaisComPermutas(diaHoje, 'reforco').length}</strong></div>
            <div style={{ flex: 1 }}><span style={{ fontSize: "11px", color: "#888" }}>👥 Total</span><br/><strong style={{ fontSize: "16px", color: "#2e7d32" }}>{getPoliciaisComPermutas(diaHoje, 'pm').length + getPoliciaisComPermutas(diaHoje, 'reforco').length}</strong></div>
          </div>
          <div style={{ backgroundColor: darkMode ? "#252525" : "#f5f5f5", padding: "8px", borderRadius: "5px", marginTop: "8px", fontSize: "12px", wordBreak: "break-word" }}>
            {getPoliciaisComPermutas(diaHoje, 'pm').length > 0 && <div style={{ marginBottom: "3px" }}><strong style={{ color: azulPmpi }}>Plantão:</strong> {getPoliciaisComPermutas(diaHoje, 'pm').join(", ")}</div>}
            {getPoliciaisComPermutas(diaHoje, 'reforco').length > 0 && <div><strong style={{ color: "#d32f2f" }}>Reforço:</strong> {getPoliciaisComPermutas(diaHoje, 'reforco').join(", ")}</div>}
            {getPoliciaisComPermutas(diaHoje, 'pm').length === 0 && getPoliciaisComPermutas(diaHoje, 'reforco').length === 0 && <span style={{ color: "#888" }}>Nenhum policial escalado para hoje.</span>}
          </div>
        </div>

        {modoComandante && (
          <button onClick={publicarAlteracoes} style={{ width: "100%", padding: "15px", backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", marginBottom: "15px", cursor: "pointer" }}>💾 SALVAR ALTERAÇÕES NA NUVEM (PARA A TROPA VER)</button>
        )}

        {modoComandante && (
          <button onClick={gerarEscalaAutomatica} style={{ width: "100%", padding: "15px", backgroundColor: "#ff9800", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", marginBottom: "15px", cursor: "pointer" }}>🤖 GERAR ESCALA AUTOMÁTICA (1x3)</button>
        )}

        {abaAtiva === "GERAL" && modoComandante && (
          <button onClick={gerarPDFEscalaOficial} style={{ width: "100%", padding: "15px", backgroundColor: "#d32f2f", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", marginBottom: "15px" }}>📄 GERAR ESCALA MENSAL (PDF OFICIAL)</button>
        )}

        {modoComandante && (
          <div style={{ backgroundColor: s.card, padding: "15px", borderRadius: "10px", marginBottom: "15px", borderLeft: "6px solid " + amareloPmpi }}>
            <h4 style={{ color: azulPmpi, marginBottom: "10px" }}>📊 SERVIÇOS EM {mesesNome[mes].toUpperCase()} - 2026</h4>
            <div style={{ display: "grid", gap: "8px" }}>
              {todosPoliciais.map(policial => {
                const servicos = contarServicos(policial);
                return (
                  <div key={policial} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: darkMode ? "#252525" : "#f5f5f5", borderRadius: "8px", border: policial === meuNome ? "2px solid " + amareloPmpi : "1px solid transparent" }}>
                    <span style={{ fontWeight: "bold", color: s.txt }}>{policial === meuNome ? "⭐ " : "👤 "}{policial}</span>
                    <span style={{ backgroundColor: azulPmpi, color: amareloPmpi, padding: "4px 12px", borderRadius: "15px", fontWeight: "bold", fontSize: "14px" }}>{servicos} {servicos === 1 ? "serviço" : "serviços"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {abaAtiva === "GERAL" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
            <div style={{ backgroundColor: s.card, padding: "15px", borderRadius: "10px", border: "1px solid " + azulPmpi, borderLeft: "6px solid " + azulPmpi }}>
              <h4 style={{ margin: "0 0 10px 0", color: azulPmpi }}>📝 FAZER PARTE PARA PERMUTA DE SERVIÇO</h4>
              <div style={{ display: "grid", gap: "5px" }}>
                <input type="text" placeholder="Data do Serviço ex:00/00/0000" value={permutaInfo.dataServico} onChange={(e) => setPermutaInfo({...permutaInfo, dataServico: e.target.value})} style={{padding: "8px", backgroundColor: darkMode ? "#333" : "#fff", color: s.txt}}/>
                <select value={permutaInfo.substituto} onChange={(e) => setPermutaInfo({...permutaInfo, substituto: e.target.value})} style={{padding: "8px", backgroundColor: darkMode ? "#333" : "#fff", color: s.txt}}><option value="">Substituto</option>{todosPoliciais.filter(p => p !== policialLogado).map(p => <option key={p} value={p}>{p}</option>)}<option value="OUTRO">OUTRO</option></select>
                {permutaInfo.substituto === "OUTRO" && (
                  <input type="text" placeholder="Nome do Policial Externo" value={permutaInfo.outroSubstituto} onChange={(e) => setPermutaInfo({...permutaInfo, outroSubstituto: e.target.value})} style={{padding: "8px", backgroundColor: "#fffde7", color: "#333"}}/>
                )}
                <input type="text" placeholder="Compensação (Opcional)" value={permutaInfo.dataContrapartida} onChange={(e) => setPermutaInfo({...permutaInfo, dataContrapartida: e.target.value})} style={{padding: "8px", backgroundColor: darkMode ? "#333" : "#fff", color: s.txt}}/>
                <div style={{ display: "flex", gap: "5px" }}><button onClick={gerarPDFPermuta} style={{ flex: 1, padding: "12px", backgroundColor: azulPmpi, color: "white", borderRadius: "5px", border: "none" }}>GERAR PDF</button><button onClick={() => window.open("https://assinador.iti.br/", "_blank")} style={{ flex: 1, backgroundColor: amareloPmpi, border: "none", borderRadius: "5px", color: azulPmpi, fontWeight: "bold" }}>ASSINAR GOV</button></div>
              </div>
            </div>
            
            <button onClick={gerarComposicaoWhatsApp} style={{ padding: "14px", backgroundColor: podeAcessarComposicao ? "#d32f2f" : "#ccc", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: podeAcessarComposicao ? "pointer" : "not-allowed" }}>GUARNIÇÃO DE SERVIÇO ENVIAR A COMPOSIÇÃO CLICANDO AQUI! (WHATSAPP)</button>
            
            <div style={{ backgroundColor: s.card, padding: "15px", borderRadius: "10px", border: "1px solid #d32f2f", borderLeft: "6px solid #d32f2f" }}>
              <h4 style={{ color: "#d32f2f", marginBottom: "10px" }}>📢 FAZER RELATÓRIO DA OCORRÊNCIA</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <input type="text" placeholder="👤 Nome da Vítima" value={nomeVitima} onChange={(e) => setNomeVitima(e.target.value)} style={{padding: "8px", backgroundColor: darkMode ? "#333" : "#fff", color: s.txt, borderRadius: "5px", border: "1px solid #ccc"}}/>
                <input type="text" placeholder="⚖️ Nome do Acusado" value={nomeAcusado} onChange={(e) => setNomeAcusado(e.target.value)} style={{padding: "8px", backgroundColor: darkMode ? "#333" : "#fff", color: s.txt, borderRadius: "5px", border: "1px solid #ccc"}}/>
                <div style={{ gridColumn: "span 2" }}>
  <label style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px", display: "block", color: s.txt }}>
    🚨 Tipos de Crime (selecione um ou mais):
  </label>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "5px" }}>
    {["Furto", "Roubo", "Direção Perigosa", "Descumprimento de Medida Protetiva", "Ameaça", "Lesão Corporal", "Violência Doméstica", "Dano ao Patrimônio", "Perturbação do Sossego", "Porte Ilegal de Arma", "Tráfico de Drogas", "Posse de Drogas", "Uso de Drogas", "Desacato", "Resistência", "Desobediência", "Vias de fato", "Dirigir Embriagado", "Acidente de Trânsito", "OUTRO"].map(tipo => (
      <label key={tipo} style={{ 
        padding: "5px 10px", 
        borderRadius: "15px", 
        fontSize: "11px",
        cursor: "pointer",
        backgroundColor: crimes.includes(tipo) ? azulPmpi : (darkMode ? "#333" : "#f0f0f0"),
        color: crimes.includes(tipo) ? "white" : s.txt,
        border: crimes.includes(tipo) ? "1px solid " + azulPmpi : "1px solid #ccc"
      }}>
        <input 
          type="checkbox" 
          checked={crimes.includes(tipo)} 
          onChange={() => {
            if (crimes.includes(tipo)) {
              setCrimes(crimes.filter(c => c !== tipo));
              if (tipo === "OUTRO") setOutroCrime("");
            } else {
              setCrimes([...crimes, tipo]);
            }
          }}
          style={{ display: "none" }}
        />
        {tipo}
      </label>
    ))}
  </div>
  {crimes.includes("OUTRO") && (
    <input 
      type="text" 
      placeholder="Digite o tipo de crime..." 
      value={outroCrime} 
      onChange={(e) => setOutroCrime(e.target.value)}
      style={{ 
        padding: "8px", 
        backgroundColor: darkMode ? "#333" : "#fff", 
        color: s.txt, 
        borderRadius: "5px", 
        border: "1px solid " + amareloPmpi, 
        width: "100%",
        marginTop: "5px"
      }} 
    />
  )}
</div>
              </div>
              <textarea style={{ width: "100%", height: "100px", marginBottom: "10px", backgroundColor: darkMode ? "#333" : "#fff", color: s.txt, padding: "10px", borderRadius: "5px" }} placeholder="Descreva aqui o relato da ocorrência..." value={relatoOcorrencia} onChange={(e) => setRelatoOcorrencia(e.target.value)} />
              <button onClick={gerarRelatorioWhatsApp} style={{ width: "100%", padding: "12px", backgroundColor: "#25d366", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold" }}>CLIQUE AQUI PARA ENVIAR O RELATÓRIO PARA O WHATSAPP DO COMANDANTE DO GPM</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", margin: "15px 0", gap: "10px", alignItems: "center" }}>
          <button onClick={() => { setMes(new Date().getMonth()); setTimeout(() => { const el = document.getElementById("dia-" + new Date().getDate()); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }} style={{ padding: "10px 15px", backgroundColor: amareloPmpi, color: azulPmpi, border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>📅 HOJE</button>  
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} style={{ padding: "10px", borderRadius: "5px", backgroundColor: s.card, color: s.txt, border: "2px solid " + azulPmpi }}>{mesesNome.map((m, i) => <option key={i} value={i}>{m.toUpperCase()}</option>)}</select>
        </div>

        <nav style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "15px", justifyContent: "center" }}>
          {["GERAL", "FÉRIAS", ...todosPoliciais].map(aba => { 
            const isRestrita = aba !== "GERAL" && aba !== "FÉRIAS" && aba !== policialLogado && !modoComandante; 
            return <button key={aba} disabled={isRestrita} onClick={() => setAbaAtiva(aba)} style={{ padding: "8px 10px", borderRadius: "20px", border: "none", backgroundColor: isRestrita ? "#ccc" : (abaAtiva === aba ? azulPmpi : s.card), color: isRestrita ? "#888" : (abaAtiva === aba ? amareloPmpi : azulPmpi), whiteSpace: "nowrap", fontWeight: "bold", fontSize: "0.8rem" }}>{aba}</button>; 
          })}
        </nav>

        {abaAtiva === "FÉRIAS" ? (
          <div style={{ backgroundColor: s.card, padding: "20px", borderRadius: "10px", textAlign: "center", borderLeft: "6px solid " + azulPmpi }}>
            <h3>FÉRIAS - {mesesNome[mes].toUpperCase()}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
              {todosPoliciais.map(p => <button key={p} onClick={() => alternarFerias(p)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: ferias[mes]?.includes(p) ? "#d32f2f" : "transparent", color: ferias[mes]?.includes(p) ? "#fff" : s.txt, fontWeight: "bold" }}>{p}</button>)}
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: s.card, borderRadius: "10px", overflowX: "auto", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
             <thead style={{ backgroundColor: azulPmpi, color: amareloPmpi }}>
  <tr>
    <th style={{ padding: "12px", width: "10%" }}>Dia</th>
    <th style={{ textAlign: "left", width: "45%" }}>👮 Plantão</th>
    <th style={{ textAlign: "left", width: "45%" }}>🛡️ Reforço</th>
  </tr>
</thead>
              <tbody>
                {diasParaExibir.map(dia => {
                  const chaveD = mes + "_" + dia; const dO = new Date(2026, mes, dia);
                  const isHoje = dia === diaHoje && mes === mesHoje;
                  const policiaisPM = escala[chaveD]?.pm || [];
                  const policiaisReforco = escala[chaveD]?.reforco || [];
                  return (
                   <tr key={dia} id={"dia-" + dia} style={{ borderBottom: "1px solid #eee", backgroundColor: isHoje ? "rgba(255, 204, 0, 0.1)" : ([5,6,0].includes(dO.getDay()) ? (darkMode ? "#2c1c1c" : "#fff0f0") : "transparent"), border: isHoje ? "3px solid " + amareloPmpi : "none" }}>
                     <td style={{ padding: "15px", textAlign: "center", fontWeight: "bold", color: [0,6,5].includes(dO.getDay()) ? "#d32f2f" : azulPmpi, border: "1px solid #ddd" }}>
                       {dia}<div style={{ fontSize: "0.7rem", fontWeight: "normal" }}>{diasSemanaLong[dO.getDay()].split("-")[0]}</div>
                       {modoComandante && (
                         <button onClick={(e) => { e.stopPropagation(); setObsAberta(obsAberta === dia ? null : dia); setObservacoes({...observacoes, [dia]: escala[mes + "_" + dia]?.observacao || ""}); }} style={{ fontSize: "10px", marginTop: "3px", background: "none", border: "1px solid #ccc", borderRadius: "3px", cursor: "pointer", color: s.txt }}>{escala[mes + "_" + dia]?.observacao ? "📌" : "➕"}</button>
                       )}
                       {escala[mes + "_" + dia]?.observacao && <div style={{ fontSize: "9px", color: "#ff9800", fontStyle: "italic", marginTop: "3px" }}>{escala[mes + "_" + dia].observacao}</div>}
                     </td>
                    <td style={{ padding: "10px", verticalAlign: "top", border: "1px solid #ddd" }}>
  <div onClick={() => abrirSeletor(dia, 'pm')} style={{ fontWeight: "bold", cursor: modoComandante ? "pointer" : "default", minHeight: "20px" }}>
    {policiaisPM.length === 1 && policiaisReforco.length === 0 ? (
  <span style={{ animation: "piscar 1s infinite", color: "#d32f2f", fontWeight: "bold" }}>
    ⚠️ {ordenarPorAntiguidade(policiaisPM).map(policial => {
      const substituto = temPermuta(policial, dia);
      return (
        <span 
          key={policial} 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (modoComandante) abrirModalPermutaClique(policial, dia, 'pm'); 
          }} 
          style={{ cursor: modoComandante ? "pointer" : "default" }}
        >
          <span style={{ textDecoration: substituto ? "line-through" : "none", color: substituto ? "#b0b0b0" : "inherit" }}>{policial}</span>
          {substituto && <span style={{ marginLeft: "5px", color: "inherit", fontWeight: "bold" }}>→ {substituto}</span>}
        </span>
      );
    })}
  </span>
) : (
      ordenarPorAntiguidade(policiaisPM).map(policial => {
        const substituto = temPermuta(policial, dia);
        return <span key={policial} onClick={(e) => { e.stopPropagation(); abrirModalPermutaClique(policial, dia, 'pm'); }} style={{ cursor: modoComandante ? "pointer" : "default", display: "inline-block", marginRight: "5px" }}>
          <span style={{ textDecoration: substituto ? "line-through" : "none", color: substituto ? "#b0b0b0" : "inherit" }}>{policial}</span>
          {substituto && <span style={{ marginLeft: "5px", color: "inherit", fontWeight: "bold" }}>→ {substituto}</span>}
        </span>;
      })
    )}
    {policiaisPM.length === 0 && "---"}
  </div>
  {escala[chaveD]?.infoPermuta && (
    <div style={{fontSize: '0.7rem', color: '#d32f2f', fontWeight: 'bold', marginTop: '3px'}}>🔄 {escala[chaveD].infoPermuta}</div>
  )}
</td>
<td style={{ padding: "10px", verticalAlign: "top", border: "1px solid #ddd" }}>
  <div onClick={() => abrirSeletor(dia, 'reforco')} style={{ color: "#d32f2f", fontSize: "0.85rem", cursor: modoComandante ? "pointer" : "default", minHeight: "20px" }}>
    {policiaisReforco.length > 0 ? (
      ordenarPorAntiguidade(policiaisReforco).map(policial => {
        const substituto = temPermuta(policial, dia);
        return <span key={policial} onClick={(e) => { e.stopPropagation(); abrirModalPermutaClique(policial, dia, 'reforco'); }} style={{ cursor: modoComandante ? "pointer" : "default", display: "inline-block", marginRight: "5px" }}>
          <span style={{ textDecoration: substituto ? "line-through" : "none", color: substituto ? "#b0b0b0" : "inherit" }}>{policial}</span>
          {substituto && <span style={{ marginLeft: "5px", color: "inherit", fontWeight: "bold" }}>→ {substituto}</span>}
        </span>;
      })
    ) : (modoComandante ? "+ Reforço" : "")}
  </div>
</td>
                   </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL DE OBSERVAÇÃO */}
        {obsAberta && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1002, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ backgroundColor: s.card, padding: "20px", borderRadius: "10px", width: "90%", maxWidth: "350px" }}>
              <h4 style={{ color: azulPmpi, marginBottom: "10px" }}>📝 Observação - Dia {obsAberta}</h4>
              <input type="text" placeholder="Ex: Feriado, Evento, Chuva..." value={observacoes[obsAberta] || ""} onChange={(e) => setObservacoes({...observacoes, [obsAberta]: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", marginBottom: "10px", backgroundColor: s.card, color: s.txt }} />
              <div style={{ display: "flex", gap: "5px" }}>
                <button onClick={() => salvarObservacao(obsAberta)} style={{ flex: 1, padding: "10px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>SALVAR</button>
                <button onClick={() => setObsAberta(null)} style={{ flex: 1, padding: "10px", backgroundColor: "#d32f2f", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>CANCELAR</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <footer style={{ padding: "20px", textAlign: "center", fontSize: "0.8rem", color: "#888" }}>
        <p>© 2026 GPM Buriti dos Montes. Desenvolvido por <strong>3ºSgt Rilton Lima Beserra</strong>.</p>
      </footer>
        </div>
    </>
  );
};

export default App;
