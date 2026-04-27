const BRANDING = {
    "Lusófona Lisboa": { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
    "Lusófona Porto":  { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
    "IPLUSO":          { hex: "#A20736", bgSub: "#780528", logo: "https://i.postimg.cc/fLR0Nksd/Logo-IPLUSO-ECIA-2.png" },
    "ISLA Gaia":       { hex: "#BB969B", bgSub: "#9C797E", logo: "https://i.postimg.cc/kGyZtjz7/Versa-o-Horizontal-Branco-2048x853.png" },
    "ISMAT":           { hex: "#7AC7CD", bgSub: "#5CA2A8", logo: "https://i.postimg.cc/0jpvXd31/logo-ISMAT-02.png" }
};

// Full Course List (278 courses)
const rawCourses = [
    { "name": "Gestao Aeronautica", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Artes Visuais", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Design De Comunicacao", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Design E Producao De Moda", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Ciencia Politica E Relacoes Internacionais", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Estudos Europeus E Relacoes Internacionais", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Estudos Portugueses", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Sociologia", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Animacao Digital", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Ciencia E Tecnologias Do Som", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Cinema E Artes Dos Media", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Formacao De Atores Cinema Televisao Teatro", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Fotografia", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Videojogos", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Ciencias Da Comunicacao", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Comunicacao Aplicada Marketing Publicidade E Relacoes Publicas", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Comunicacao E Jornalismo", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Educacao Fisica E Desporto", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Criminologia", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Direito", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Contabilidade Fiscalidade E Auditoria", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Economia", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Gestao De Empresas", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Gestao De Recursos Humanos", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Ciencias Da Educacao Educacao Social", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Bioeconomia Circular E Tecnologia", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Biomedicina Computacional E Inteligencia Artificial", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Biotecnologia", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia Biomedica", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia Civil", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia Do Ambiente", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia E Gestao Industrial", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia Eletrotecnica E De Computadores", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Tecnologias E Gestao Do Ambiente", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Ciencia De Dados", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Computacao E Matematica Aplicada", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia Informatica", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia Informatica Redes E Telecomunicacoes", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Informatica De Gestao", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Psicologia", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Biologia", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Bioquimica", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Ciencias Da Nutricao", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Cuidados De Beleza E Bem Estar", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Estudos De Seguranca Interna", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Servico Social", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Turismo", "degree": "Licenciaturas", "institution": "Lusófona Lisboa" },
    { "name": "Arquitetura", "degree": "Mestrados integrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciencias Farmaceuticas", "degree": "Mestrados integrados", "institution": "Lusófona Lisboa" },
    { "name": "Medicina Veterinaria", "degree": "Mestrados integrados", "institution": "Lusófona Lisboa" },
    { "name": "Urbanismo", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Design", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Design E Producao De Moda", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Pintura", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciencia Politica Cidadania E Governacao", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Comunicacao Politica", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Diplomacia E Relacoes Internacionais", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Patrimonio Cultural Imaterial", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Sociomuseologia", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Artes Da Animacao", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Design De Jogos E Media Jogaveis", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Estudos Cinematograficos", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Fotografia", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Inteligencia Artificial Para Jogos", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Patrimonio Cinematografico E Audiovisual", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Producao E Tecnologias Do Som", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Realizacao Para Cinema Documental", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Comunicacao Nas Organizacoes", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Comunicacao Marketing E Media Digitais", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Estudos Em Jornalismo E Media", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Jornalismo Aplicado Inovacao Digital E Tecnologias Emergentes", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ensino De Educacao Fisica Nos Ensinos Basico E Secundario", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Exercicio E Saude", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Futebol Da Formacao A Alta Competicao", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Treino Desportivo", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciencias Criminais", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Direito", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Direito Do Mercado", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Direito Do Trabalho E Da Seguranca Social", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Direito Empresarial", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Direito Publico E Regulacao", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Contabilidade Fiscalidade E Financas", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Economia", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Gestao Avancada De Recursos Humanos", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Gestao De Empresas", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Gestao Financeira", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciencia Cognitiva E Educacao", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciencias Da Educacao", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciencias Da Educacao Educacao Especial Dominio Cognitivo E Motor", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ensino De Artes Visuais No 3O Ciclo Do Ensino Basico E No Ensino Secundario", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ensino De Informatica", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Biotecnologia Alimentar E Molecular", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia Civil", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia Do Ambiente", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia E Gestao Industrial", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciencia De Dados", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciencias De Dados Aplicada A Sistemas De Informacao Geografica", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Engenharia Informatica E Sistemas De Informacao", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Inteligencia Artificial Aplicada E Computacao", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciberespaco Comportamento E Terapia Digital", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Neuropsicologia Aplicada", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Psicologia Clinica E Da Saude", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Psicologia Forense", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Psicologia Social E Das Organizacoes", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Transdisciplinar De Sexologia", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Ciencia Das Religioes", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Bioquimica Aplicada", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Embriologia E Reproducao Humana", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Nutricao Clinica", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Quimica De Bioativos Naturais", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Gerontologia Social Qualidade De Programas E Servicos Gerontologicos", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Servico Social E Politica Social", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Desenvolvimento E Gestao De Destinos Turisticos", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Gestao E Inovacao Em Turismo E Hospitalidade", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Cirurgia Em Animais De Companhia", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Clinica De Equinos", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Enfermagem Veterinaria Clinica", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Imagiologia Clinica Em Animais De Companhia", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Medicina Em Animais De Companhia", "degree": "Mestrados", "institution": "Lusófona Lisboa" },
    { "name": "Arquitetura", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Urbanismo", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Sociomuseologia", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Arte Dos Media E Comunicacao", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Ciencias Da Comunicacao", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Educacao Fisica E Desporto", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Direito", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Educacao", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Informatica", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Psicologia Clinica Orientacao Cognitivo Comportamental", "degree": "Doutoramentos", "institution": "Lusófona Lisboa" },
    { "name": "Artes Dramaticas Formacao De Atores", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Design De Comunicacao", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Design E Producao De Moda", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Estudos Europeus Estudos Lusofonos E Relacoes Internacionais", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Comunicacao Audiovisual E Multimedia", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Videojogos E Aplicacoes Multimedia", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Ciencias Da Comunicacao", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Comunicacao Aplicada", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Educacao Fisica E Desporto", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Direito", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Economia", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Gestao", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Gestao Comercial", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Gestao E Desenvolvimento De Recursos Humanos", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Ciencias Da Educacao", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Computacao E Matematica Aplicada", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Engenharia Civil", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Engenharia De Protecao Civil", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Engenharia Do Ambiente", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Engenharia Eletrotecnica De Sistemas De Energia", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Protecao Civil", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Engenharia Informatica", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Psicologia", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Servico Social", "degree": "Licenciaturas", "institution": "Lusófona Porto" },
    { "name": "Arquitetura Cup", "degree": "Mestrados integrados", "institution": "Lusófona Porto" },
    { "name": "Relacoes Internacionais", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Comunicacao Marketing E Media Digitais", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Comunicacao Redes E Tecnologias", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Gestao Cultural", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Media E Cidadania Digital", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Ensino De Educacao Fisica Nos Ensinos Basico E Secundario", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Exercicio E Saude", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Treino Desportivo Em Futebol", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Ciencias Juridico Criminais", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Direito", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Gestao", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Gestao De Organizacoes Da Economia Social", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Gestao De Recursos Humanos", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Gestao Financeira", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Ciencias Da Educacao", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Ensino De Informatica", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Mediacao Gestao De Conflitos E Cidadania", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Protecao Civil", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Sistemas De Energia Inteligentes E Sustentaveis", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Ciencias De Dados Aplicada A Sistemas De Informacao Geografica", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Neuropsicologia Clinica", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Psicologia Clinica E Da Saude", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Psicologia Da Justica Vitimas De Crime", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Gestao E Inovacao Em Turismo E Hospitalidade", "degree": "Mestrados", "institution": "Lusófona Porto" },
    { "name": "Arte Multimedia Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Automacao E Sistemas Informaticos Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Ciencias Biomedicas Laboratoriais Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Contabilidade E Financas Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Educacao Basica Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Enfermagem Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Enfermagem Veterinaria Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Engenharia Informatica E Aplicacoes Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Farmacia Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Gestao Comercial Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Gestao De Empresas Do Turismo Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Gestao Empresarial Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Ilustracao E Desenho Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Imagem Medica E Radioterapia Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Osteopatia Pt", "degree": "Licenciaturas", "institution": "IPLUSO" },
    { "name": "Artes Visuais E Media Digitais Pt", "degree": "Mestrados", "institution": "IPLUSO" },
    { "name": "Desenho Pt", "degree": "Mestrados", "institution": "IPLUSO" },
    { "name": "Educacao Pre Escolar Pt", "degree": "Mestrados", "institution": "IPLUSO" },
    { "name": "Educacao Pre Escolar E Ensino Do 1O Ciclo Do Ensino Basico Pt", "degree": "Mestrados", "institution": "IPLUSO" },
    { "name": "Enfermagem Veterinaria Clinica Pt", "degree": "Mestrados", "institution": "IPLUSO" },
    { "name": "Ensino Do 1O Ciclo Do Ensino Basico E De Matematica E Ciencias Naturais No 2O Ciclo Do Ensino Basico Pt", "degree": "Mestrados", "institution": "IPLUSO" },
    { "name": "Gestao Empresarial E Negocios Digitais Pt", "degree": "Mestrados", "institution": "IPLUSO" },
    { "name": "Ilustracao Experimental E Narrativas Graficas Pt", "degree": "Mestrados", "institution": "IPLUSO" },
    { "name": "Saude Digital Pt", "degree": "Mestrados", "institution": "IPLUSO" },
    { "name": "Acompanhamento De Criancas E Jovens Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Aplicacoes Informaticas Para Ciencias De Dados Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Assessoria Em Administracao E Gestao Publica Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Automacao E Robotica Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Bioanalises E Controlo Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Ciberseguranca Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Contabilidade E Gestao Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Desenvolvimento De Sistemas Para Internet Das Coisas Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Desenvolvimento Para A Web E Dispositivos Moveis Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Gestao Administrativa De Recursos Humanos Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Gestao Comercial E Vendas Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Gestao De Hotelaria E Restauracao Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Gestao De Marketing Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Gestao De Negocios E Comercio Eletronico Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Gestao De Sistemas De Informacao Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Instalacoes Eletricas E Automacao Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Laboratorio Forense E Criminal Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Marketing Digital Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Producao De Conteudos Audiovisuais Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Sistemas De Telecomunicacoes Eletronica E Comunicacoes Pt", "degree": "Ctesp", "institution": "IPLUSO" },
    { "name": "Ciberseguranca Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Comunicacao Digital Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Contabilidade E Gestao Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Controlo Da Qualidade E Analises Laboratoriais Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Desenvolvimento De Aplicacoes De Inteligencia Artificial Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Desenvolvimento De Produtos Multimedia Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Desenvolvimento Para A Web E Dispositivos Moveis Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Gastronomia Vinhos E Turismo Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Gestao Administrativa De Recursos Humanos Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Gestao Da Qualidade Ambiente E Seguranca Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Gestao De Atividades Desportivas Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Gestao De Redes Sociais E Estrategias Digitais Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Gestao De Turismo Hotelaria E Restauracao Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Gestao De Vendas E Marketing Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Marketing Digital E Comercio Eletronico Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Redes E Sistemas Informaticos Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Som E Imagem Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Turismo E Informacao Turistica Pt", "degree": "Ctesp", "institution": "ISLA Gaia" },
    { "name": "Comunicacao Digital Pt", "degree": "Licenciaturas", "institution": "ISLA Gaia" },
    { "name": "Engenharia Da Seguranca Do Trabalho Pt", "degree": "Licenciaturas", "institution": "ISLA Gaia" },
    { "name": "Engenharia Informatica Pt", "degree": "Licenciaturas", "institution": "ISLA Gaia" },
    { "name": "Gestao De Empresas Pt", "degree": "Licenciaturas", "institution": "ISLA Gaia" },
    { "name": "Gestao De Recursos Humanos Pt", "degree": "Licenciaturas", "institution": "ISLA Gaia" },
    { "name": "Gestao Do Turismo Pt", "degree": "Licenciaturas", "institution": "ISLA Gaia" },
    { "name": "Informatica Para Comercio Eletronico Pt", "degree": "Licenciaturas", "institution": "ISLA Gaia" },
    { "name": "Inteligencia Artificial Pt", "degree": "Licenciaturas", "institution": "ISLA Gaia" },
    { "name": "Multimedia Pt", "degree": "Licenciaturas", "institution": "ISLA Gaia" },
    { "name": "Engenharia De Tecnologias E Sistemas Web Pt", "degree": "Mestrados", "institution": "ISLA Gaia" },
    { "name": "Engenharia Informatica Pt", "degree": "Mestrados", "institution": "ISLA Gaia" },
    { "name": "Financas E Fiscalidade Pt", "degree": "Mestrados", "institution": "ISLA Gaia" },
    { "name": "Gestao Pt", "degree": "Mestrados", "institution": "ISLA Gaia" },
    { "name": "Gestao Da Seguranca E Saude Do Trabalho Pt", "degree": "Mestrados", "institution": "ISLA Gaia" },
    { "name": "Gestao De Projetos Pt", "degree": "Mestrados", "institution": "ISLA Gaia" },
    { "name": "Gestao De Recursos Humanos Pt", "degree": "Mestrados", "institution": "ISLA Gaia" },
    { "name": "Ciencia De Dados Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Ciencias Do Desporto Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Computacao E Matematica Aplicada Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Design Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Design E Producao De Moda E Textil Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Direito Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Engenharia Informatica Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Gestao De Empresas Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Gestao De Recursos Humanos Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Gestao Do Turismo Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Psicologia Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Tecnologias Criativas Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Arquitetura Pt", "degree": "Licenciaturas", "institution": "ISMAT" },
    { "name": "Arquitetura Pt", "degree": "Mestrados", "institution": "ISMAT" },
    { "name": "Biodesign Pt", "degree": "Mestrados", "institution": "ISMAT" },
    { "name": "Design Para A Economia Circular Pt", "degree": "Mestrados", "institution": "ISMAT" },
    { "name": "Direito Do Trabalho E Da Seguranca Social Pt", "degree": "Mestrados", "institution": "ISMAT" },
    { "name": "Ensino De Artes Visuais No 3O Ciclo Do Ensino Basico E No Ensino Secundario Pt", "degree": "Mestrados", "institution": "ISMAT" },
    { "name": "Gestao De Recursos Humanos E Intervencao Organizacional Pt", "degree": "Mestrados", "institution": "ISMAT" },
    { "name": "Gestao E Inovacao Em Turismo E Hospitalidade Pt", "degree": "Mestrados", "institution": "ISMAT" },
    { "name": "Psicologia Do Trabalho E Da Saude Ocupacional Pt", "degree": "Mestrados", "institution": "ISMAT" },
    { "name": "Reabilitacao De Edificios E Sitios Pt", "degree": "Mestrados", "institution": "ISMAT" }
];

// Add IDs and Mock Keywords to the full list
const courses = rawCourses.map((c, i) => ({
    id: i + 1,
    ...c,
    description: `${c.degree} in ${c.name} at ${c.institution}.`,
    gscKeywords: [
        { term: `${c.name.toLowerCase()} course`, clicks: Math.floor(Math.random() * 1000) },
        { term: `${c.name.toLowerCase()} university`, clicks: Math.floor(Math.random() * 500) }
    ],
    adsKeywords: [
        { term: `${c.name.toLowerCase()} course`, impressions: Math.floor(Math.random() * 10000) },
        { term: `best ${c.name.toLowerCase()} degree`, impressions: Math.floor(Math.random() * 5000) }
    ]
}));

let activeCourseId = 1;

function init() {
    renderCourseList();
    loadCourse(activeCourseId);
    
    document.getElementById('keyword-search').addEventListener('input', (e) => {
        filterKeywords(e.target.value);
    });

    document.getElementById('gsc-upload').addEventListener('change', (e) => handleFileUpload(e, 'gsc'));
    document.getElementById('ads-upload').addEventListener('change', (e) => handleFileUpload(e, 'ads'));
    
    // Ensure course list is rendered even if no local data
    renderCourseList();
    loadData();
}

async function syncToGitHub() {
    let token = localStorage.getItem('github_token');
    if (!token) {
        token = prompt("Please enter your GitHub Personal Access Token (PAT) to sync with the team:");
        if (!token) return;
        localStorage.setItem('github_token', token);
    }

    const btn = document.getElementById('sync-btn');
    const status = document.getElementById('sync-status');
    
    btn.disabled = true;
    btn.innerHTML = "⏳ Syncing...";
    status.style.display = "block";
    status.textContent = "Connecting to GitHub...";

    const repo = "LaminatedYamal/ULUS-FONA";
    const path = "courses.json";
    
    try {
        // 1. Get the current file SHA
        const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!getRes.ok) throw new Error("Could not find courses.json on GitHub.");
        const fileData = await getRes.json();
        const sha = fileData.sha;

        // 2. Prepare the new content
        // We only sync the raw data to keep the file clean
        const exportData = courses.map(c => ({
            name: c.name,
            degree: c.degree,
            institution: c.institution,
            gscKeywords: c.gscKeywords,
            adsKeywords: c.adsKeywords
        }));

        const content = b64EncodeUnicode(JSON.stringify(exportData, null, 2));

        // 3. Push to GitHub
        const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: "Update keywords via Antigravity Dashboard",
                content: content,
                sha: sha,
                branch: "main"
            })
        });

        if (putRes.ok) {
            status.textContent = "✅ Sync Successful! Dashboard will update for everyone in ~60s.";
            setTimeout(() => { status.style.display = "none"; }, 5000);
        } else {
            const err = await putRes.json();
            throw new Error(err.message || "Failed to push to GitHub.");
        }

    } catch (error) {
        alert("Sync Failed: " + error.message);
        status.textContent = "❌ Sync Failed";
        if (error.message.includes("401")) {
            localStorage.removeItem('github_token');
            alert("Token invalid or expired. Please try again.");
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = "🚀 Sync to Team";
    }
}

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function saveData() {
    localStorage.setItem('antigravity_courses', JSON.stringify(courses));
}

function loadData() {
    const saved = localStorage.getItem('antigravity_courses');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved data back into the courses array
        parsed.forEach(savedCourse => {
            const index = courses.findIndex(c => c.id === savedCourse.id);
            if (index !== -1) {
                courses[index].gscKeywords = savedCourse.gscKeywords;
                courses[index].adsKeywords = savedCourse.adsKeywords;
            }
        });
        loadCourse(activeCourseId);
    }
}

async function handleFileUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        let keywords = [];

        if (file.name.endsWith('.xml')) {
            keywords = parseXML(content);
        } else if (file.name.endsWith('.csv')) {
            keywords = parseCSV(content);
        }

        if (keywords.length > 0) {
            // Update the active course data temporarily
            const course = courses.find(c => c.id === activeCourseId);
            
            if (type === 'gsc') {
                course.gscKeywords = keywords;
                alert(`Successfully synced ${keywords.length} GSC keywords!`);
            } else {
                // If it's ads, we map the 'clicks' property to 'impressions'
                course.adsKeywords = keywords.map(k => ({ 
                    term: k.term, 
                    impressions: k.clicks || Math.floor(Math.random() * 1000) 
                }));
                alert(`Successfully synced ${keywords.length} Ads keywords!`);
            }
            
            renderTables(course.gscKeywords, course.adsKeywords);
            updateStats(course);
            saveData();
        } else {
            alert('Could not find valid keyword data in this file.');
        }
    };
    reader.readAsText(file);
}

function parseXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const results = [];
    
    // Support common GSC or tool XML exports
    const tags = ['keyword', 'query', 'term', 'Keyword', 'Query'];
    let nodes = [];
    
    for (const tag of tags) {
        const found = xmlDoc.getElementsByTagName(tag);
        if (found.length > 0) {
            nodes = found;
            break;
        }
    }

    for (let i = 0; i < nodes.length; i++) {
        const term = nodes[i].textContent.trim();
        // Look for sibling metric nodes
        const parent = nodes[i].parentNode;
        // Search for clicks OR impressions
        const metricNode = parent.querySelector('clicks, Clicks, impressions, Impressions, volume, Volume');
        const metricValue = parseInt(metricNode?.textContent || Math.floor(Math.random() * 500));
        
        if (term) results.push({ term, clicks: metricValue });
    }
    
    return results;
}

function parseCSV(csvString) {
    const lines = csvString.split('\n');
    const results = [];
    
    // Simple CSV parser
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 2) {
            const term = cols[0].replace(/"/g, '').trim();
            const clicks = parseInt(cols[1].replace(/"/g, '').trim()) || 0;
            if (term) results.push({ term, clicks });
        }
    }
    return results;
}

function renderCourseList() {
    const list = document.getElementById('course-list');
    list.innerHTML = '';

    // Grouping Logic
    const grouped = {};
    courses.forEach(course => {
        if (!grouped[course.institution]) grouped[course.institution] = {};
        if (!grouped[course.institution][course.degree]) grouped[course.institution][course.degree] = [];
        grouped[course.institution][course.degree].push(course);
    });

    Object.keys(grouped).forEach(inst => {
        // Institution Header
        const instHeader = document.createElement('div');
        instHeader.className = 'nav-group-header';
        instHeader.textContent = inst;
        list.appendChild(instHeader);

        Object.keys(grouped[inst]).forEach(degree => {
            // Degree Accordion
            const degreeDetails = document.createElement('details');
            degreeDetails.className = 'nav-degree-group';
            
            const summary = document.createElement('summary');
            summary.textContent = degree;
            degreeDetails.appendChild(summary);

            const ul = document.createElement('ul');
            grouped[inst][degree].forEach(course => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="course-name">${course.name}</span>`;
                li.dataset.id = course.id;
                if (course.id === activeCourseId) li.classList.add('active');
                
                li.addEventListener('click', () => {
                    document.querySelectorAll('#course-list li').forEach(el => el.classList.remove('active'));
                    li.classList.add('active');
                    loadCourse(course.id);
                });
                ul.appendChild(li);
            });
            degreeDetails.appendChild(ul);
            list.appendChild(degreeDetails);
        });
    });
}

function loadCourse(id) {
    activeCourseId = id;
    const course = courses.find(c => c.id === id);
    const brand = BRANDING[course.institution];
    
    // Apply Branding
    document.documentElement.style.setProperty('--accent-primary', brand.hex);
    document.documentElement.style.setProperty('--accent-secondary', brand.bgSub);
    
    // Set RGB for gradients
    const rgb = hexToRgb(brand.hex);
    if (rgb) {
        document.documentElement.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }

    const logoContainer = document.querySelector('.logo-container');
    logoContainer.style.backgroundColor = brand.bgSub;
    logoContainer.style.borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;

    document.getElementById('brand-logo').src = brand.logo;
    document.getElementById('brand-name').textContent = course.institution;
    
    document.getElementById('active-course-title').textContent = course.name;
    document.getElementById('active-course-desc').textContent = `${course.degree} | ${course.institution}`;
    
    renderTables(course.gscKeywords, course.adsKeywords);
    updateStats(course);

    // Auto-open parent accordion
    const activeLi = document.querySelector(`#course-list li[data-id="${id}"]`);
    if (activeLi) {
        const parentDetails = activeLi.closest('details');
        if (parentDetails) parentDetails.open = true;
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function renderTables(gsc, ads) {
    const gscBody = document.getElementById('gsc-body');
    const adsBody = document.getElementById('ads-body');
    
    gscBody.innerHTML = '';
    adsBody.innerHTML = '';
    
    const gscTerms = gsc.map(k => k.term.toLowerCase());
    const adsTerms = ads.map(k => k.term.toLowerCase());
    
    gsc.forEach(k => {
        const tr = document.createElement('tr');
        const isMatch = adsTerms.includes(k.term.toLowerCase());
        tr.innerHTML = `
            <td>${k.term}</td>
            <td>${k.clicks.toLocaleString()}</td>
            <td>${isMatch ? '<span class="match-tag">✓ Active in Ads</span>' : '<span class="text-muted">Organic Only</span>'}</td>
        `;
        gscBody.appendChild(tr);
    });
    
    ads.forEach(k => {
        const tr = document.createElement('tr');
        const isMatch = gscTerms.includes(k.term.toLowerCase());
        tr.innerHTML = `
            <td>${k.term}</td>
            <td>${isMatch ? '<span class="match-tag">✓ Active in GSC</span>' : '<span class="gap-tag">⚠ Organic Gap</span>'}</td>
        `;
        adsBody.appendChild(tr);
    });
}

function updateStats(course) {
    const gscCount = course.gscKeywords.length;
    const adsCount = course.adsKeywords.length;
    const gscTerms = course.gscKeywords.map(k => k.term.toLowerCase());
    const adsTerms = course.adsKeywords.map(k => k.term.toLowerCase());
    const matches = adsTerms.filter(term => gscTerms.includes(term)).length;
    const parity = adsCount > 0 ? Math.round((matches / adsCount) * 100) : 0;
    const gaps = adsTerms.filter(term => !gscTerms.includes(term)).length;
    
    document.getElementById('gsc-count').textContent = gscCount;
    document.getElementById('ads-count').textContent = adsCount;
    document.getElementById('parity-score').textContent = `${parity}%`;
    document.getElementById('parity-bar').style.width = `${parity}%`;
    document.getElementById('gap-count').textContent = gaps;
}

function filterKeywords(query) {
    const q = query.toLowerCase();
    const course = courses.find(c => c.id === activeCourseId);
    const filteredGsc = course.gscKeywords.filter(k => k.term.toLowerCase().includes(q));
    const filteredAds = course.adsKeywords.filter(k => k.term.toLowerCase().includes(q));
    renderTables(filteredGsc, filteredAds);
}

document.addEventListener('DOMContentLoaded', init);
