// The supplied word bank remains the source of every explanation and example.
export function ruleGroups(words,category){
  const groups=new Map();
  for(const word of words){
    if(word.category!==category||!word.learning)continue;
    const learning=word.learning,key=learning.type+'|'+learning.title;
    if(!groups.has(key))groups.set(key,{key,title:learning.title,type:learning.type,explanation:learning.explanation,examples:[],words:[]});
    const group=groups.get(key);
    if(group.words.length<10)group.words.push(word);
    for(const example of learning.examples){
      if(group.examples.length<10&&!group.examples.some(item=>item.from===example.from&&item.to===example.to))group.examples.push(example);
    }
  }
  return [...groups.values()].sort((a,b)=>({pattern:0,exchange:1,exception:2,memory:3}[a.type]-{pattern:0,exchange:1,exception:2,memory:3}[b.type]));
}
