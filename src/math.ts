/** Canonical exact damage state. Display rounding never re-enters this model. */
export class Rational {
  readonly n: bigint; readonly d: bigint;
  constructor(n: bigint | number | string, d: bigint | number | string = 1) {
    let a=BigInt(n), b=BigInt(d); if(b===0n) throw new Error('Zero denominator');
    if(b<0n){a=-a;b=-b;} let x=a<0n?-a:a,y=b; while(y){const t=x%y;x=y;y=t;}
    const g=x||1n; this.n=a/g;this.d=b/g;
  }
  add(b:Rational){return new Rational(this.n*b.d+b.n*this.d,this.d*b.d);}
  sub(b:Rational){return new Rational(this.n*b.d-b.n*this.d,this.d*b.d);}
  mul(b:Rational){return new Rational(this.n*b.n,this.d*b.d);}
  compare(b:Rational){const v=this.n*b.d-b.n*this.d;return v<0n?-1:v>0n?1:0;}
  toNumber(){return Number(this.n)/Number(this.d);}
  toString(){return this.d===1n?`${this.n}`:`${this.n}/${this.d}`;}
}
export type AttackKind='bolt'|'pulse';
export const BOLT=new Rational(18);
export function resolveStrike(hp:Rational,kind:AttackKind,boosted=false){
  if(hp.n<0n) throw new Error('HP must be nonnegative');
  const before=hp; const base=kind==='pulse'?before:BOLT;
  const normal=kind==='pulse'?before.mul(new Rational(1,4)):BOLT;
  const valid=hp.compare(new Rational(0))>0;
  const raw=valid?(boosted?normal.mul(new Rational(3,2)):normal):new Rational(0);
  const applied=raw.compare(hp)>0?hp:raw;
  return {before,base,raw,applied,after:hp.sub(applied),boosted:valid&&boosted};
}
