// Importar módulo express
const express = require('express');

// Importa módulo fileupload
const fileupload = require('express-fileupload');

// Importar módulo express-handlebars
const { engine } = require('express-handlebars');

// Importar módulo mysql
const mysql = require('mysql2');

// File Systems
const fs = require('fs');

// App
const app = express();

// habilitando o upload de arquivos
app.use(fileupload());

// Adicionar Bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// Adicionar CSS
app.use('/css', express.static('./css'));

// Referenciar a pasta de imagens
app.use('/imagens', express.static('./imagens'));

// Config do express-handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');


// Manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({extended:false}));


// Config de conexão
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '978015',
    database: 'projeto'
});

// Teste de Conexão
conexao.connect(function(erro){
    if(erro) throw erro;
    console.log('Conexão efetuada com sucesso!')
});

// Rota principal
app.get('/', function(req, res){
    // SQL
    let sql = 'SELECT * FROM produtos';

    // Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {produtos:retorno});
    });
});

// Rota de cadastro
app.post('/cadastrar', function(req, res){
   // Obter os dados que serão utilizados para o cadastro
   let nome = req.body.nome;
   let valor = req.body.valor;
   let imagem = req.files.imagem.name;

   // SQL
   let sql = `INSERT INTO produtos (nome, valor, imagem) VALUES ('${nome}', ${valor}, '${imagem}')`;

   // Executar comando SQL
   conexao.query(sql, function(erro, retorno){
        // Caso ocorra algum erro
        if(erro) throw erro;

        // Caso ocorra o cadastro
        req.files.imagem.mv(__dirname+'/imagens/'+req.files.imagem.name);
        console.log(retorno);
   });

   // Retornar para a rota principal
   res.redirect('/');
});


// Rota para remover produtos
app.get('/remover/:codigo&:imagem', function(req, res){
    
    // SQL
    let sql = `DELETE FROM produtos WHERE codigo = ${req.params.codigo}`;

    // Executar o comando SQL
    conexao.query(sql, function(erro, retorno){
        // Caso falhe o comando SQL
        if(erro) throw erro;

        // Caso o comando SQL funcione
        fs.unlink(__dirname+'/imagens/'+req.params.imagem, (erro_imagem)=>{
            console.log('Falha ao remover a imagem ');
        });
    });

    // Redirecionamento
    res.redirect('/');

});

// Rota para redirecionar para o formulário de alteração/edição
app.get('/formularioEditar/:codigo', function(req, res){  
    
    // SQL
    let sql = `SELECT * FROM produtos WHERE codigo = ${req.params.codigo}`;

    // Executar o comando SQL
    conexao.query(sql, function(erro, retorno){
        // Caso haja falha no comando SQL
        if(erro) throw erro;
        
        // Caso consiga executar o comando SQL
        res.render('formularioEditar', {produto:retorno[0]});
    });
});

// Rota para editar produtos
app.post('/editar', function(req, res){

    // Obter os dados do formulário
    let nome = req.body.nome;
    let valor = req.body.valor;
    let codigo = req.body.codigo;
    let nomeImagem = req.body.nomeImagem;

    // Definir o tipo de edição
    try{
        // Objeto de imagem
        let imagem = req.files.imagem;

        // SQL
        let sql = `UPDATE produtos SET nome='${nome}', valor=${valor}, imagem='${imagem.name}' WHERE codigo=${codigo}`;

        // Executar comando SQL
        conexao.query(sql, function(erro, retorno){
            // Caso falhe o comando SQL
            if(erro) throw erro;

            // Remover imagem antiga
            fs.unlink(__dirname+'/imagens/'+nomeImagem, (erro_imagem)=>{
                console.log('Falha ao remover a imagem.');
            });

            // Cadastrar nova imagem
            imagem.mv(__dirname+'/imagens/'+imagem.name);
        });

    }catch(erro){
        // SQL
        let sql = `UPDATE produtos SET nome='${nome}', valor=${valor} WHERE codigo=${codigo}`;

           // Executar comando SQL
           conexao.query(sql, function(erro, retorno){
            // Caso falhe o comando SQL
            if(erro) throw erro;
        });
    }

    // Redirecionamento
    res.redirect('/');
});

// Servidor
app.listen(8080);