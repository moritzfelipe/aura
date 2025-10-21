import styles from "@/features/shared/components/post-meta.module.css";

type PostMetaProps = {
  creatorAddress: string;
  tbaAddress?: string | null;
};

const truncate = (value?: string | null) => {
  if (!value || value.length <= 12) {
    return value;
  }
  return `${value.substring(0, 6)}…${value.substring(value.length - 4)}`;
};

export function PostMeta({ creatorAddress, tbaAddress }: PostMetaProps) {
  return (
    <dl className={styles.meta}>
      <div>
        <dt>Creator</dt>
        <dd>{truncate(creatorAddress) ?? creatorAddress}</dd>
      </div>
      <div>
        <dt>Post Wallet</dt>
        <dd>{truncate(tbaAddress) ?? "—"}</dd>
      </div>
    </dl>
  );
}
