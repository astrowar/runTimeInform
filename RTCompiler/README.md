# RTCompiler



funcoes a serem implementadas

var(X) e nonVar(X) .. testa se esta com ou sem binding

member(LST,X) 

saidas dos termos podem ser 
  true ... suceeso
  false .. esse pred nao foi unificado
  fail.. esse pred e todos os demais com omesmo nome falham


definicoes

Do A(x) as {} if Z 
   define uma acao... 


   //cria uma regra
do collapsing bridge rule
   smt ...
   smt ...
   smt ...
if Z
end

regras sao conjuntos de statments que sao executados independente do que esta acontecendo. a condicao if filtra se executa ou nao


cria um conjunto de regras que podem ser ou nao adicionadas em um rulebook


do rule(rulename) as 
{

} 
ou
do rule(rulename , X ) as 
{

} 


let rulebook(rulebook name , X) as
{
   rulename()
   rulename(X)
   rulename
   ...
}



let rulebook( alternative path ) :
       collapsing bridge() 
	   closed bridge() 
	   dark path() 
if Z
end 

ha comandos para suprimir, reativar, substituir ou restaurar ao anterior

replace(  print final score ,  fancy final score) 
  informa que a regra acima esta sendo substituida por outra

restore (print final score)
  remove a substituicao


forma correta de fazer substituicao implicita
do replace(print final score) as 
   {
       fancy final score()
   }
   if  Z 

se tiver variavel ...

do replace(print article , X ) as 
   {
       fancy article(X)
   }
   if  Z 

   funcoes de modificar a lista de regras sera feitas depois

		insert front (dark path rule) in  (alternative path rulebook)
		insert back (dark path rule) in  (alternative path rulebook)

		insert back (dark path rule) after (dark path rule)
			inseri a regra apos outra em TODAS as ocorrencias
