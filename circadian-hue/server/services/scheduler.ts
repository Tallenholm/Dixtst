type Job = { id: string, clear: () => void }
export class Scheduler {
  private jobs = new Map<string, Job>()
  scheduleInterval(id:string, fn:()=>void, ms:number){ this.clear(id); const h = setInterval(fn, ms); this.jobs.set(id, { id, clear: ()=>clearInterval(h) }) }
  scheduleTimeout(id:string, fn:()=>void, ms:number){ this.clear(id); const h = setTimeout(()=>{ fn(); this.jobs.delete(id) }, ms); this.jobs.set(id, { id, clear: ()=>clearTimeout(h) }) }
  clear(id:string){ const j=this.jobs.get(id); if(j){ j.clear(); this.jobs.delete(id) } }
}
