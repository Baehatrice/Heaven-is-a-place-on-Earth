const repeat=(id,n)=>Array(n).fill(id);
const supply=['expand',...repeat('seek',3),'autoseek'];const reliability=[...repeat('speed',4),...repeat('safe',3),'retry'];const big=[...repeat('echo',3),...repeat('combo',3)];const machines=[...repeat('auto',3),'rapture'];
const strategies={
 link:['copy','template','split','addresscopy','transfer',...repeat('ledger',3),'next',...supply,...reliability,...big,...machines],
 batch:['copy','template','split','addresscopy',...repeat('batch',4),...repeat('ledger',3),'next',...supply,...reliability,...big,...machines],
 machine:['auto','copy','template','expand',...repeat('seek',3),'autoseek','auto','auto','rapture','split','addresscopy','transfer',...repeat('ledger',3),'next',...reliability,...big],
 echo:['copy','template','split','addresscopy','transfer',...reliability,'echo',...supply,...repeat('ledger',3),'next','echo','echo',...repeat('combo',3),...machines],
 hybrid:['copy','template','split','addresscopy','transfer','auto','expand',...repeat('seek',3),'autoseek',...repeat('ledger',3),'next',...reliability,'echo','auto','auto','rapture','echo','echo',...repeat('combo',3)]
};

module.exports=strategies;
