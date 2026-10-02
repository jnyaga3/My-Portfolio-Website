// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
interface IProofVerifier { function verify(bytes calldata proof, bytes32 root, bytes32 nullifier, bytes32 signal) external view returns (bool); }
contract Election {
    enum Status { Draft, Live, Closed }
    struct Candidate { uint256 id; string name; uint256 votes; }
    address public immutable owner; string public title; uint256 public immutable startAt; uint256 public immutable endAt; Status public status;
    mapping(uint256 => Candidate) public candidates; mapping(address => bool) public hasVoted; mapping(bytes32 => bool) public usedCredential; mapping(bytes32 => bool) public usedBallotHash; uint256 public candidateCount; uint256 public totalVotes;
    bytes32 public membershipRoot; IProofVerifier public proofVerifier; mapping(bytes32 => bool) public usedBallotCommitment;
    event ElectionPublished(string title, uint256 startAt, uint256 endAt); event VoteCast(bytes32 indexed ballotHash, uint256 indexed candidateId); event AnonymousVoteCast(bytes32 indexed credentialNullifier, bytes32 indexed ballotHash, uint256 indexed candidateId); event ElectionClosed(uint256 totalVotes);
    event MembershipRootUpdated(bytes32 indexed root); event ProofVerifierUpdated(address indexed verifier);
    modifier onlyOwner(){require(msg.sender==owner,"not owner");_;} modifier active(){require(status==Status.Live && block.timestamp>=startAt && block.timestamp<=endAt,"election not active");_;}
    constructor(string memory _title,uint256 _startAt,uint256 _endAt,string[] memory _candidates){require(bytes(_title).length>0,"empty title");require(_endAt>_startAt && _endAt>block.timestamp,"invalid dates");require(_candidates.length>0,"no candidates");owner=msg.sender;title=_title;startAt=_startAt;endAt=_endAt;for(uint256 i;i<_candidates.length;i++){require(bytes(_candidates[i]).length>0,"empty candidate");candidateCount++;candidates[candidateCount]=Candidate(candidateCount,_candidates[i],0);} }
    function publish() external onlyOwner { require(status==Status.Draft,"already published"); status=Status.Live; emit ElectionPublished(title,startAt,endAt); }
    function setMembershipRoot(bytes32 root) external onlyOwner { require(root != bytes32(0),"invalid root"); membershipRoot = root; emit MembershipRootUpdated(root); }
    function setProofVerifier(address verifier) external onlyOwner { require(verifier != address(0),"invalid verifier"); proofVerifier = IProofVerifier(verifier); emit ProofVerifierUpdated(verifier); }
    function vote(uint256 candidateId, bytes32 ballotHash) external active { require(!hasVoted[msg.sender],"already voted"); require(candidateId>0&&candidateId<=candidateCount,"invalid candidate"); require(ballotHash != bytes32(0) && !usedBallotHash[ballotHash],"invalid ballot"); hasVoted[msg.sender]=true;usedBallotHash[ballotHash]=true;candidates[candidateId].votes++;totalVotes++;emit VoteCast(ballotHash,candidateId); }
    /// @notice Records a vote using a one-time nullifier derived from an eligibility credential.
    /// The contract does not learn voter identity; credential issuance and proof verification belong off-chain.
    function voteWithCredential(uint256 candidateId, bytes32 credentialNullifier, bytes32 ballotHash) external active {
        candidateId; credentialNullifier; ballotHash;
        revert("deprecated: use voteWithProof");
    }
    /// @notice Semaphore-style adapter: the verifier must enforce group membership,
    /// root, signal and nullifier semantics. No identity is sent to this contract.
    function voteWithProof(uint256 candidateId, bytes32 nullifier, bytes32 ballotCommitment, bytes calldata proof, bytes32 signal) external active {
        require(address(proofVerifier) != address(0), "proof verifier not configured");
        require(membershipRoot != bytes32(0) && proofVerifier.verify(proof, membershipRoot, nullifier, signal), "invalid proof");
        require(!usedCredential[nullifier] && nullifier != bytes32(0), "nullifier already used");
        require(!usedBallotCommitment[ballotCommitment] && ballotCommitment != bytes32(0), "invalid commitment");
        require(candidateId > 0 && candidateId <= candidateCount, "invalid candidate");
        usedCredential[nullifier] = true; usedBallotCommitment[ballotCommitment] = true; candidates[candidateId].votes++; totalVotes++;
        emit AnonymousVoteCast(nullifier, ballotCommitment, candidateId);
    }
    function close() external onlyOwner { require(status==Status.Live,"not live");require(block.timestamp > endAt,"election still active");status=Status.Closed;emit ElectionClosed(totalVotes); }
    function getCandidate(uint256 id) external view returns(Candidate memory){return candidates[id];}
}
